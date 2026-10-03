const http = require("http");
const { Pool } = require("pg");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger");

const PORT = process.env.PORT || 3000;

// PostgreSQL de Render
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL
    ? { rejectUnauthorized: false }
    : false,
});

// CORS
function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function enviarJSON(res, status, data) {
  cors(res);
  res.writeHead(status, {
    "Content-Type": "application/json",
  });
  res.end(JSON.stringify(data));
}

// Servidor HTTP SIN Express
const server = http.createServer(async (req, res) => {
  cors(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Página inicial
  if (req.method === "GET" && pathname === "/") {
    return enviarJSON(res, 200, {
      servicio: "Microservicio de docentes",
      estado: "activo",
      endpoints: {
        docentes: "/docentes",
        buscar: "/docentes?nombre=nombre",
        detalle: "/docentes/1",
        swagger: "/api-docs",
      },
    });
  }

  // GET /docentes
  // GET /docentes?nombre=Juan
  if (req.method === "GET" && pathname === "/docentes") {
    try {
      const nombre = url.searchParams.get("nombre");

      let resultado;

      if (nombre) {
        resultado = await pool.query(
          `SELECT *
           FROM docentes
           WHERE LOWER(nombre) LIKE LOWER($1)
           ORDER BY nombre`,
          [`%${nombre}%`]
        );
      } else {
        resultado = await pool.query(
          `SELECT *
           FROM docentes
           ORDER BY nombre`
        );
      }

      return enviarJSON(res, 200, resultado.rows);
    } catch (error) {
      console.error("Error consultando docentes:", error);

      return enviarJSON(res, 500, {
        error: "Error consultando docentes",
        detalle: error.message,
      });
    }
  }

  // GET /docentes/1
  const detalle = pathname.match(/^\/docentes\/(\d+)$/);

  if (req.method === "GET" && detalle) {
    try {
      const id = detalle[1];

      const resultado = await pool.query(
        `SELECT *
         FROM docentes
         WHERE id = $1`,
        [id]
      );

      if (resultado.rows.length === 0) {
        return enviarJSON(res, 404, {
          error: "Docente no encontrado",
        });
      }

      return enviarJSON(res, 200, resultado.rows[0]);
    } catch (error) {
      console.error("Error consultando docente:", error);

      return enviarJSON(res, 500, {
        error: "Error consultando docente",
        detalle: error.message,
      });
    }
  }

  // Swagger JSON
  if (req.method === "GET" && pathname === "/swagger.json") {
    return enviarJSON(res, 200, swaggerDocument);
  }

  return enviarJSON(res, 404, {
    error: "Ruta no encontrada",
  });
});

server.listen(PORT, () => {
  console.log(`Microservicio de docentes iniciado en puerto ${PORT}`);
});

