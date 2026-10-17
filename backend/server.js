
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// CONFIGURACIÓN POSTGRESQL
// ============================================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

app.use(cors());
app.use(express.json({ limit: "16kb" }));

// ============================================
// CONFIGURACIÓN SWAGGER
// ============================================

const spec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "PokeAnime - Pokémon API",
      version: "1.2.0",
      description:
        "Microservicio Node.js con PostgreSQL. " +
        "Permite consultar e insertar Pokémon desde PokeAPI.",
    },
    servers: [{ url: "/" }],
    components: {
      securitySchemes: {
        AdminKey: {
          type: "apiKey",
          in: "header",
          name: "x-admin-key",
          description:
            "Clave administrativa configurada en Render",
        },
      },
    },
  },
  apis: [__filename],
});

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(spec)
);

app.get("/openapi.json", (_, res) => res.json(spec));

// ============================================
// FUNCIONES AUXILIARES
// ============================================

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

// Validar clave administrativa
function verificarAdmin(req, res, next) {
  const claveConfigurada = process.env.ADMIN_API_KEY;
  const claveRecibida = req.get("x-admin-key");

  if (!claveConfigurada) {
    return res.status(503).json({
      mensaje: "Clave administrativa no configurada",
    });
  }

  if (!claveRecibida) {
    return res.status(401).json({
      mensaje: "Debes proporcionar la clave administrativa",
    });
  }

  const a = Buffer.from(claveRecibida);
  const b = Buffer.from(claveConfigurada);

  if (
    a.length !== b.length ||
    !crypto.timingSafeEqual(a, b)
  ) {
    return res.status(401).json({
      mensaje: "Clave administrativa incorrecta",
    });
  }

  next();
}

// ============================================
// ESTADO DEL MICROSERVICIO
// ============================================

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
    version: "1.2.0",
    swagger: "/api-docs",
  });
});

// ============================================
// LISTAR POKÉMON
// ============================================

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

    return res.json(rows.map(format));
  } catch (error) {
    return fail(res, error);
  }
});

// ============================================
// BUSCAR POKÉMON POR NOMBRE O ID
// ============================================

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
        mensaje: "Pokémon no encontrado en la base de datos",
      });
    }

    return res.json(format(rows[0]));
  } catch (error) {
    return fail(res, error);
  }
});

// ============================================
// INSERTAR POKÉMON DESDE POKEAPI
// ============================================

/**
 * @openapi
 * /pokemon:
 *   post:
 *     summary: Inserta un Pokémon desde PokeAPI
 *     description: |
 *       Consulta PokeAPI utilizando el nombre del Pokémon
 *       y guarda sus datos en PostgreSQL.
 *       Requiere autorización administrativa.
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
 *         description: Pokémon insertado correctamente
 *       '400':
 *         description: Nombre inválido
 *       '401':
 *         description: No autorizado
 *       '404':
 *         description: Pokémon no encontrado en PokeAPI
 *       '409':
 *         description: Pokémon ya registrado
 *       '502':
 *         description: Error consultando PokeAPI
 *       '503':
 *         description: Clave administrativa no configurada
 */
app.post(
  "/pokemon",
  verificarAdmin,
  async (req, res) => {
    try {
      const nombre = req.body?.nombre;

      if (
        typeof nombre !== "string" ||
        !/^[a-z0-9-]{1,60}$/i.test(nombre.trim())
      ) {
        return res.status(400).json({
          mensaje: "Nombre de Pokémon inválido",
        });
      }

      const nombreNormalizado =
        nombre.trim().toLowerCase();

      // Verificar duplicados por nombre
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
            headers: {
              Accept: "application/json",
            },
          }
        );
      } catch (error) {
        console.error("[PokeAPI]", error.message);

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

      // Insertar en PostgreSQL.
      // Se utiliza el ID oficial de PokeAPI.
      const resultado = await pool.query(
        `INSERT INTO pokemon
          (
            id,
            nombre,
            altura,
            peso,
            imagen,
            movimiento1,
            movimiento2
          )
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
          mensaje:
            "Ya existe un Pokémon con ese ID o nombre",
        });
      }

      return fail(res, error);
    }
  }
);

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Pokémon API escuchando en puerto ${PORT}`
  );
  console.log(
    `Swagger disponible en /api-docs`
  );
});
