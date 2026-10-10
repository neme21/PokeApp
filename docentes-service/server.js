const http = require("http");
const { Pool } = require("pg");

const swaggerDocument = require("./swagger");

const PORT = process.env.PORT || 3002;

// ==============================
// POSTGRESQL
// ==============================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL
    ? { rejectUnauthorized: false }
    : false,
});

// ==============================
// CORS
// ==============================

function configurarCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );
}

// ==============================
// RESPUESTA JSON
// ==============================

function responderJSON(res, status, data) {
  configurarCors(res);

  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
  });

  res.end(JSON.stringify(data));
}

// ==============================
// SWAGGER HTML
// No necesita swagger-ui-express
// ==============================

function mostrarSwagger(res) {
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">

  <title>API Docentes - Swagger</title>

  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css"
  />
</head>

<body>

<div id="swagger-ui"></div>

<script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>

<script>
  SwaggerUIBundle({
    url: "/swagger.json",
    dom_id: "#swagger-ui"
  });
</script>

</body>
</html>
`;

  configurarCors(res);

  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
  });

  res.end(html);
}

// ==============================
// SERVIDOR
// ==============================

const server = http.createServer(async (req, res) => {

  configurarCors(res);

  // Preflight CORS
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(
    req.url,
    `http://${req.headers.host}`
  );

  const pathname = url.pathname;

  // ==============================
  // GET /
  // ==============================

  if (req.method === "GET" && pathname === "/") {
    return responderJSON(res, 200, {
      servicio: "API Docentes UNINPAHU",
      estado: "Funcionando",
      endpoints: {
        docentes: "/docentes",
        buscar: "/docentes?nombre=nombre",
        detalle: "/docentes/1",
        documentacion: "/api-docs",
        openapi: "/swagger.json",
      },
    });
  }

  // ==============================
  // GET /swagger.json
  // ==============================

  if (
    req.method === "GET" &&
    pathname === "/swagger.json"
  ) {
    return responderJSON(
      res,
      200,
      swaggerDocument
    );
  }

  // ==============================
  // GET /api-docs
  // ==============================

  if (
    req.method === "GET" &&
    pathname === "/api-docs"
  ) {
    return mostrarSwagger(res);
  }

  // También permitimos /docs
  if (
    req.method === "GET" &&
    pathname === "/docs"
  ) {
    return mostrarSwagger(res);
  }

  // ==============================
  // GET /docentes
  // GET /docentes?nombre=Felipe
  // ==============================

  if (
    req.method === "GET" &&
    pathname === "/docentes"
  ) {
    try {
      const nombre =
        url.searchParams.get("nombre");

      let resultado;

      if (nombre && nombre.trim() !== "") {
        resultado = await pool.query(
          `
          SELECT *
          FROM docentes
          WHERE nombre ILIKE $1
          ORDER BY nombre
          `,
          [`%${nombre.trim()}%`]
        );
      } else {
        resultado = await pool.query(
          `
          SELECT *
          FROM docentes
          ORDER BY id
          `
        );
      }

      return responderJSON(
        res,
        200,
        resultado.rows
      );
    } catch (error) {
      console.error(
        "Error consultando docentes:",
        error
      );

      return responderJSON(res, 500, {
        error: "Error consultando docentes",
        detalle: error.message,
      });
    }
  }

  // ==============================
  // GET /docentes/:id
  // ==============================

  const coincidencia =
    pathname.match(/^\/docentes\/(\d+)$/);

  if (
    req.method === "GET" &&
    coincidencia
  ) {
    try {
      const id = coincidencia[1];

      const resultado = await pool.query(
        `
        SELECT *
        FROM docentes
        WHERE id = $1
        `,
        [id]
      );

      if (resultado.rows.length === 0) {
        return responderJSON(res, 404, {
          error: "Docente no encontrado",
        });
      }

      return responderJSON(
        res,
        200,
        resultado.rows[0]
      );
    } catch (error) {
      console.error(
        "Error consultando docente:",
        error
      );

      return responderJSON(res, 500, {
        error: "Error consultando docente",
        detalle: error.message,
      });
    }
  }

  // CRUD de docentes: lectura del cuerpo con límite de tamaño
  if (["POST", "PUT"].includes(req.method) &&
      (pathname === "/docentes" || coincidencia)) {
    try {
      let cuerpo = "";
      for await (const parte of req) {
        cuerpo += parte.toString();
        if (cuerpo.length > 100000) return responderJSON(res, 413, {error:"Solicitud demasiado grande"});
      }
      let datos;
      try { datos = JSON.parse(cuerpo); }
      catch { return responderJSON(res, 400, {error:"JSON inválido"}); }
      if (!datos || typeof datos.nombre !== "string" || !datos.nombre.trim()) {
        return responderJSON(res, 400, {error:"El nombre es obligatorio"});
      }
      const campos = ["nombre", "cargo", "programa", "descripcion", "imagen"];
      const valores = campos.map(c => c === "nombre" ? datos.nombre.trim() :
        (typeof datos[c] === "string" ? datos[c].trim() || null : null));
      if (req.method === "POST" && pathname === "/docentes") {
        const r = await pool.query(
          "INSERT INTO docentes (nombre,cargo,programa,descripcion,imagen) VALUES ($1,$2,$3,$4,$5) RETURNING *", valores);
        return responderJSON(res, 201, r.rows[0]);
      }
      if (req.method === "PUT" && coincidencia) {
        const r = await pool.query(
          "UPDATE docentes SET nombre=$1,cargo=$2,programa=$3,descripcion=$4,imagen=$5 WHERE id=$6 RETURNING *",
          [...valores, coincidencia[1]]);
        return responderJSON(res, r.rowCount ? 200 : 404,
          r.rows[0] || {error:"Docente no encontrado"});
      }
    } catch (error) {
      console.error("Error guardando docente", error);
      return responderJSON(res, 500, {error:"No se pudo guardar el docente"});
    }
  }

  if (req.method === "DELETE" && coincidencia) {
    try {
      const r = await pool.query("DELETE FROM docentes WHERE id=$1 RETURNING id", [coincidencia[1]]);
      return responderJSON(res, r.rowCount ? 200 : 404,
        r.rowCount ? {mensaje:"Docente eliminado", id:r.rows[0].id} : {error:"Docente no encontrado"});
    } catch (error) {
      console.error("Error eliminando docente", error);
      return responderJSON(res, 500, {error:"No se pudo eliminar el docente"});
    }
  }

  // ==============================
  // 404
  // ==============================

  return responderJSON(res, 404, {
    error: "Ruta no encontrada",
  });
});

// ==============================
// INICIAR
// ==============================

server.listen(PORT, () => {
  console.log(
    `Microservicio de docentes iniciado en puerto ${PORT}`
  );
});