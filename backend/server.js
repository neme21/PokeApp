
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

app.use(cors());
app.use(express.json({ limit: "16kb" }));

// Swagger
const spec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "PokeAnime - Pokémon API",
      version: "1.1.0",
      description:
        "Microservicio Node.js con PostgreSQL. " +
        "Permite consultar e insertar Pokémon.",
    },
    servers: [{ url: "/" }],
  },
  apis: [__filename],
});

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(spec)
);

app.get("/openapi.json", (_, res) => res.json(spec));

// Formatear registros
function format(p) {
  return {
    id: p.id,
    nombre: p.nombre,
    altura: Number(p.altura),
    peso: Number(p.peso),
    imagen: p.imagen,
    movimientos: [
      p.movimiento1,
      p.movimiento2,
    ],
  };
}

function fail(res, error) {
  console.error("[Pokemon API]", error);
  return res.status(500).json({
    mensaje: "Error interno del servidor",
  });
}

/**
 * @openapi
 * /:
 *   get:
 *     summary: Estado del microservicio
 *     responses:
 *       '200':
 *         description: Servicio funcionando
 */
app.get("/", (_, res) => {
  res.json({
    mensaje: "Microservicio Pokémon funcionando",
    swagger: "/api-docs",
  });
});

/**
 * @openapi
 * /pokemon:
 *   get:
 *     summary: Lista todos los Pokémon almacenados
 *     responses:
 *       '200':
 *         description: Lista de Pokémon
 */
app.get("/pokemon", async (_, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM pokemon ORDER BY id"
    );

    res.json(rows.map(format));
  } catch (error) {
    fail(res, error);
  }
});

/**
 * @openapi
 * /pokemon/{busqueda}:
 *   get:
 *     summary: Busca un Pokémon por nombre o ID
 *     parameters:
 *       - in: path
 *         name: busqueda
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Pokémon encontrado
 *       '404':
 *         description: Pokémon no encontrado
 */
app.get("/pokemon/:busqueda", async (req, res) => {
  try {
    const q = req.params.busqueda.trim().toLowerCase();
    const numeric = /^\d+$/.test(q);

    const { rows } = await pool.query(
      numeric
        ? "SELECT * FROM pokemon WHERE id = $1"
        : "SELECT * FROM pokemon WHERE LOWER(nombre) = $1",
      [numeric ? Number(q) : q]
    );

    if (!rows[0]) {
      return res.status(404).json({
        mensaje: "Pokémon no encontrado",
      });
    }

    res.json(format(rows[0]));
  } catch (error) {
    fail(res, error);
  }
});

/**
 * @openapi
 * /pokemon:
 *   post:
 *     summary: Inserta un Pokémon desde PokeAPI
 *     description: |
 *       Consulta PokeAPI por nombre y guarda sus
 *       datos en PostgreSQL.
 *       Requiere una clave administrativa.
 *     security:
 *       - AdminKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: heracross
 *     responses:
 *       '201':
 *         description: Pokémon insertado
 *       '400':
 *         description: Nombre inválido
 *       '401':
 *         description: No autorizado
 *       '404':
 *         description: Pokémon no existe en PokeAPI
 *       '409':
 *         description: Pokémon ya registrado
 *       '502':
 *         description: Error consultando PokeAPI
 */
app.post("/pokemon", async (req, res) => {
  try {
    // No permitir inserciones públicas sin autorización.
    if (!process.env.ADMIN_API_KEY) {
      return res.status(503).json({
        mensaje: "Clave administrativa no configurada",
      });
    }

    if (req.get("x-admin-key") !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({
        mensaje: "No autorizado",
      });
    }

    const nombre = req.body?.nombre;

    if (
      typeof nombre !== "string" ||
      !/^[a-z0-9-]{1,60}$/i.test(nombre.trim())
    ) {
      return res.status(400).json({
        mensaje: "Nombre de Pokémon inválido",
      });
    }

    const nombreNormalizado = nombre.trim().toLowerCase();

    const existente = await pool.query(
      "SELECT id FROM pokemon WHERE LOWER(nombre) = $1",
      [nombreNormalizado]
    );

    if (existente.rows.length > 0) {
      return res.status(409).json({
        mensaje: "Este Pokémon ya está registrado",
      });
    }

    // Consultar PokeAPI
    let respuesta;

    try {
      respuesta = await fetch(
        `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(nombreNormalizado)}`,
        {
          signal: AbortSignal.timeout(15000),
        }
      );
    } catch (error) {
      console.error("Error PokeAPI:", error.message);
      return res.status(502).json({
        mensaje: "No se pudo conectar con PokeAPI",
      });
    }

    if (respuesta.status === 404) {
      return res.status(404).json({
        mensaje: "Pokémon no encontrado en PokeAPI",
      });
    }

    if (!respuesta.ok) {
      return res.status(502).json({
        mensaje: "PokeAPI no respondió correctamente",
      });
    }

    const pokemon = await respuesta.json();

    const movimiento1 =
      pokemon.moves?.[0]?.move?.name || "N/A";

    const movimiento2 =
      pokemon.moves?.[1]?.move?.name || "N/A";

    const imagen =
      pokemon.sprites?.other?.["official-artwork"]
        ?.front_default ||
      pokemon.sprites?.front_default ||
      null;

    // Mantener el ID oficial de PokeAPI.
    // La tabla debe admitir IDs explícitos.
    const resultado = await pool.query(
      `INSERT INTO pokemon
        (id, nombre, altura, peso, imagen,
         movimiento1, movimiento2)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        pokemon.id,
        pokemon.name,
        pokemon.height,
        pokemon.weight,
        imagen,
        movimiento1,
        movimiento2,
      ]
    );

    return res.status(201).json({
      mensaje: "Pokémon insertado correctamente",
      pokemon: format(resultado.rows[0]),
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        mensaje: "Ya existe un Pokémon con ese ID o nombre",
      });
    }

    return fail(res, error);
  }
});

// Incluir autenticación administrativa en Swagger.
spec.components = {
  ...(spec.components || {}),
  securitySchemes: {
    ...(spec.components?.securitySchemes || {}),
    AdminKey: {
      type: "apiKey",
      in: "header",
      name: "x-admin-key",
    },
  },
};

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Pokémon API en puerto ${PORT}`);
});
