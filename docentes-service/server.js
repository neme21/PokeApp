const http = require("http");
const { Pool } = require("pg");
const { URL } = require("url");
const swagger = require("./swagger");

const PORT = process.env.PORT || 3001;

// Base de datos PostgreSQL
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Respuesta JSON
function responder(res, codigo, datos) {
  res.writeHead(codigo, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*"
  });

  res.end(JSON.stringify(datos));
}

// Servidor
const server = http.createServer(async (req, res) => {

  const url = new URL(req.url, `http://${req.headers.host}`);

  try {

    // Página principal
    if (url.pathname === "/") {
      return responder(res, 200, {
        mensaje: "API Docentes UNINPAHU",
        estado: "Funcionando"
      });
    }

    // Documento OpenAPI
    if (url.pathname === "/openapi.json") {
      return responder(res, 200, swagger);
    }

    // Swagger
    if (url.pathname === "/docs") {

      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>API Docentes UNINPAHU</title>

        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css"
        >
      </head>

      <body>

        <div id="swagger-ui"></div>

        <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>

        <script>
          SwaggerUIBundle({
            url: "/openapi.json",
            dom_id: "#swagger-ui"
          });
        </script>

      </body>
      </html>
      `;

      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8"
      });

      return res.end(html);
    }

    // ==========================================
    // GET /docentes
    // GET /docentes?nombre=Omar
    // ==========================================

    if (url.pathname === "/docentes") {

      const nombre = url.searchParams.get("nombre");

      if (nombre) {

        const resultado = await db.query(
          `SELECT * FROM docentes
           WHERE nombre ILIKE $1
           OR apellido ILIKE $1`,
          [`%${nombre}%`]
        );

        return responder(res, 200, resultado.rows);
      }

      const resultado = await db.query(
        "SELECT * FROM docentes ORDER BY id"
      );

      return responder(res, 200, resultado.rows);
    }

    // ==========================================
    // GET /docentes/1
    // ==========================================

    if (url.pathname.startsWith("/docentes/")) {

      const id = url.pathname.split("/")[2];

      const resultado = await db.query(
        "SELECT * FROM docentes WHERE id = $1",
        [id]
      );

      if (resultado.rows.length === 0) {
        return responder(res, 404, {
          mensaje: "Docente no encontrado"
        });
      }

      return responder(res, 200, resultado.rows[0]);
    }

    // Ruta no encontrada
    responder(res, 404, {
      mensaje: "Ruta no encontrada"
    });

  } catch (error) {

    console.log(error);

    responder(res, 500, {
      mensaje: "Error del servidor"
    });
  }
});

server.listen(PORT, () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
});

