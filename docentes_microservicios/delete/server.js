
const express = require('express');
const { Pool } = require('pg');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const app = express();
const PORT = process.env.PORT || 3000;
const SERVICE = 'delete';

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
 *   delete:
 *     summary: Eliminar un docente
 *     description: Elimina un docente de PostgreSQL mediante su ID.
 *     tags:
 *       - Docentes DELETE
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Identificador del docente
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: header
 *         name: Idempotency-Key
 *         required: true
 *         description: UUID único de la operación para evitar reintentos duplicados
 *         schema:
 *           type: string
 *           format: uuid
 *           example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: Resultado de la eliminación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 eliminado:
 *                   type: boolean
 *                 id:
 *                   type: integer
 *       400:
 *         description: ID o clave de idempotencia inválidos
 *       500:
 *         description: Error interno del servidor
 */
app.delete('/docentes/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                error: 'ID inválido'
            });
        }

        const result = await once(req, async c => {
            const r = await c.query(
                'DELETE FROM docentes WHERE id=$1 RETURNING id',
                [id]
            );

            return {
                eliminado: r.rowCount > 0,
                id
            };
        });

        res.status(200).json(result);

    } catch (error) {
        console.error('Error eliminando docente:', error);

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
