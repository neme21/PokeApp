
const express = require('express');
const { Pool } = require('pg');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const app = express();
const PORT = process.env.PORT || 3000;
const SERVICE = 'read';

// CONEXIÓN A POSTGRESQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL &&
        !/localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL)
        ? { rejectUnauthorized: false }
        : false
});

// MIDDLEWARES
app.use(express.json());

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

// SWAGGER
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

/**
 * @swagger
 * /docentes:
 *   get:
 *     summary: Obtener todos los docentes
 *     description: Consulta todos los docentes almacenados en PostgreSQL.
 *     tags:
 *       - Docentes READ
 *     responses:
 *       200:
 *         description: Lista de docentes obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Docente'
 *       500:
 *         description: Error interno del servidor
 */
app.get('/docentes', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM docentes ORDER BY id'
        );

        res.status(200).json(result.rows);

    } catch (error) {
        console.error('Error consultando docentes:', error);

        res.status(500).json({
            error: 'Error interno'
        });
    }
});

/**
 * @swagger
 * /docentes/{id}:
 *   get:
 *     summary: Obtener un docente por ID
 *     description: Consulta un docente específico en PostgreSQL.
 *     tags:
 *       - Docentes READ
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Identificador del docente
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Docente encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Docente'
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Docente no encontrado
 *       500:
 *         description: Error interno del servidor
 */
app.get('/docentes/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                error: 'ID inválido'
            });
        }

        const result = await pool.query(
            'SELECT * FROM docentes WHERE id=$1',
            [id]
        );

        if (!result.rowCount) {
            return res.status(404).json({
                error: 'Docente no encontrado'
            });
        }

        res.status(200).json(result.rows[0]);

    } catch (error) {
        console.error('Error consultando docente:', error);

        res.status(500).json({
            error: 'Error interno'
        });
    }
});

// RUTAS NO ENCONTRADAS
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
