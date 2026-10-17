
const express = require('express');
const { Pool } = require('pg');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const app = express();
const PORT = process.env.PORT || 3000;
const SERVICE = 'update';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL &&
        !/localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL)
        ? { rejectUnauthorized: false }
        : false
});

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
    res.json({
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
 * /docentes/{id}:
 *   put:
 *     summary: Actualizar un docente
 *     description: Modifica un docente almacenado en PostgreSQL.
 *     tags:
 *       - Docentes
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del docente
 *       - in: header
 *         name: Idempotency-Key
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID único para esta operación
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
 *               apellido:
 *                 type: string
 *               cargo:
 *                 type: string
 *               programa:
 *                 type: string
 *               perfil:
 *                 type: string
 *               imagen:
 *                 type: string
 *     responses:
 *       200:
 *         description: Docente actualizado correctamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Docente no encontrado
 *       500:
 *         description: Error interno
 */
app.put('/docentes/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                error: 'ID inválido'
            });
        }

        const d = valid(req.body);

        const result = await once(req, async c => {
            const r = await c.query(
                `UPDATE docentes
                 SET nombre=$1,
                     apellido=$2,
                     cargo=$3,
                     programa=$4,
                     perfil=$5,
                     imagen=$6
                 WHERE id=$7
                 RETURNING *`,
                [
                    d.nombre,
                    d.apellido,
                    d.cargo,
                    d.programa,
                    d.perfil,
                    d.imagen,
                    id
                ]
            );

            if (!r.rowCount) {
                const error = new Error(
                    'Docente no encontrado'
                );
                error.status = 404;
                throw error;
            }

            return r.rows[0];
        });

        res.status(200).json(result);

    } catch (error) {
        console.error(error);

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

app.listen(PORT, () => {
    console.log(
        `Microservicio ${SERVICE} ejecutándose en puerto ${PORT}`
    );
});
