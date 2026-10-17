
const express = require('express');
const { Pool } = require('pg');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const app = express();
const PORT = process.env.PORT || 3000;
const SERVICE = 'create';

// CONEXIÓN A POSTGRESQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL &&
        !/localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL)
        ? { rejectUnauthorized: false }
        : false
});

// MIDDLEWARES
app.use(express.json({ limit: '100kb' }));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
        'Access-Control-Allow-Headers',
        'Content-Type, Idempotency-Key'
    );
    res.header(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, OPTIONS'
    );

    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }

    next();
});

// DOCUMENTACIÓN SWAGGER
app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
);

// HEALTH CHECK
app.get('/health', (req, res) => {
    res.status(200).json({
        service: SERVICE,
        ok: true
    });
});

// VALIDACIÓN DE DOCENTES
function valid(d) {
    if (
        !d ||
        typeof d.nombre !== 'string' ||
        !d.nombre.trim() ||
        typeof d.apellido !== 'string' ||
        !d.apellido.trim()
    ) {
        const error = new Error(
            'Nombre y apellido obligatorios'
        );
        error.status = 400;
        throw error;
    }

    const v = x =>
        typeof x === 'string'
            ? x.trim() || null
            : null;

    return {
        nombre: d.nombre.trim(),
        apellido: d.apellido.trim(),
        cargo: v(d.cargo),
        programa: v(d.programa),
        perfil: v(d.perfil ?? d.descripcion),
        imagen: v(d.imagen)
    };
}

// CONTROL DE IDEMPOTENCIA
async function once(req, action) {
    const key = req.headers['idempotency-key'];

    if (
        typeof key !== 'string' ||
        !/^[0-9a-f-]{36}$/i.test(key)
    ) {
        const error = new Error(
            'Idempotency-Key UUID obligatorio'
        );
        error.status = 400;
        throw error;
    }

    const c = await pool.connect();

    try {
        await c.query('BEGIN');

        await c.query(`
            CREATE TABLE IF NOT EXISTS docentes_sync_ops (
                op_id TEXT PRIMARY KEY,
                respuesta JSONB NOT NULL
            )
        `);

        await c.query(
            'SELECT pg_advisory_xact_lock(hashtext($1))',
            [key]
        );

        const prev = await c.query(
            'SELECT respuesta FROM docentes_sync_ops WHERE op_id=$1',
            [key]
        );

        if (prev.rowCount) {
            await c.query('COMMIT');
            return prev.rows[0].respuesta;
        }

        const result = await action(c);

        await c.query(
            `INSERT INTO docentes_sync_ops
             (op_id, respuesta)
             VALUES ($1, $2::jsonb)`,
            [key, JSON.stringify(result)]
        );

        await c.query('COMMIT');

        return result;

    } catch (error) {
        await c.query('ROLLBACK');
        throw error;
    } finally {
        c.release();
    }
}

/**
 * @swagger
 * /docentes:
 *   post:
 *     summary: Crear un nuevo docente
 *     description: Inserta un docente en PostgreSQL.
 *     tags:
 *       - Docentes CREATE
 *     parameters:
 *       - in: header
 *         name: Idempotency-Key
 *         required: true
 *         description: UUID único para evitar inserciones repetidas
 *         schema:
 *           type: string
 *           format: uuid
 *           example: 550e8400-e29b-41d4-a716-446655440000
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - apellido
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Laura
 *               apellido:
 *                 type: string
 *                 example: Martínez
 *               cargo:
 *                 type: string
 *                 example: Docente
 *               programa:
 *                 type: string
 *                 example: Ingeniería de Software
 *               perfil:
 *                 type: string
 *                 example: Especialista en bases de datos
 *               imagen:
 *                 type: string
 *                 example: https://example.com/docente.jpg
 *     responses:
 *       201:
 *         description: Docente creado correctamente
 *       400:
 *         description: Datos inválidos o UUID faltante
 *       500:
 *         description: Error interno del servidor
 */
app.post('/docentes', async (req, res) => {
    try {
        const d = valid(req.body);

        const result = await once(req, async c => {
            const r = await c.query(
                `INSERT INTO docentes
                 (nombre, apellido, cargo, programa, perfil, imagen)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING *`,
                [
                    d.nombre,
                    d.apellido,
                    d.cargo,
                    d.programa,
                    d.perfil,
                    d.imagen
                ]
            );

            return r.rows[0];
        });

        res.status(201).json(result);

    } catch (error) {
        console.error('Error creando docente:', error);

        res.status(error.status || 500).json({
            error: error.status
                ? error.message
                : 'Error interno'
        });
    }
});

// RUTA NO ENCONTRADA
app.use((req, res) => {
    res.status(404).json({
        error: 'Ruta no encontrada'
    });
});

// INICIAR SERVIDOR
app.listen(PORT, () => {
    console.log(
        `Microservicio ${SERVICE} ejecutándose en puerto ${PORT}`
    );
});
