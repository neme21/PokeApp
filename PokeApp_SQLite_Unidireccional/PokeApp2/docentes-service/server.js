
const http = require("http");
const { Pool } = require("pg");
const swaggerDocument = require("./swagger");

const PORT = process.env.PORT || 3002;

// ======================================
// CONEXIÓN A POSTGRESQL
// ======================================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_URL &&
    !/localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL)
      ? { rejectUnauthorized: false }
      : false,
});

// ======================================
// CONFIGURACIÓN CORS
// ======================================

function configurarCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );
}

// ======================================
// RESPUESTAS JSON
// ======================================

function responderJSON(res, status, data) {
  configurarCors(res);

  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
  });

  res.end(JSON.stringify(data));
}

// ======================================
// SWAGGER
// ======================================

function mostrarSwagger(res) {
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
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

// ======================================
// LEER CUERPO JSON
// ======================================

async function leerJSON(req) {
  let cuerpo = "";
  let tamano = 0;

  for await (const parte of req) {
    tamano += parte.length;

    if (tamano > 100000) {
      const error = new Error("Solicitud demasiado grande");
      error.status = 413;
      throw error;
    }

    cuerpo += parte.toString("utf8");
  }

  try {
    return JSON.parse(cuerpo);
  } catch {
    const error = new Error("JSON inválido");
    error.status = 400;
    throw error;
  }
}

// ======================================
// NORMALIZAR CAMPOS
// ======================================

function textoOpcional(valor) {
  if (typeof valor !== "string") {
    return null;
  }

  return valor.trim() || null;
}

function normalizarDocente(datos) {
  if (
    !datos ||
    typeof datos !== "object" ||
    Array.isArray(datos)
  ) {
    const error = new Error("Los datos del docente no son válidos");
    error.status = 400;
    throw error;
  }

  if (
    typeof datos.nombre !== "string" ||
    !datos.nombre.trim()
  ) {
    const error = new Error("El nombre es obligatorio");
    error.status = 400;
    throw error;
  }

  return {
    nombre: datos.nombre.trim(),
    apellido: textoOpcional(datos.apellido),
    cargo: textoOpcional(datos.cargo),
    programa: textoOpcional(datos.programa),

    // El formulario puede enviar "descripcion".
    // PostgreSQL almacena el texto en "perfil".
    perfil: textoOpcional(
      datos.perfil !== undefined
        ? datos.perfil
        : datos.descripcion
    ),

    imagen: textoOpcional(datos.imagen),
  };
}

// ======================================
// SERVIDOR HTTP
// ======================================

const server = http.createServer(async (req, res) => {
  configurarCors(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(
    req.url,
    `http://${req.headers.host || "localhost"}`
  );

  const pathname = url.pathname;

  // ======================================
  // POST /sync/docentes - sincronización local -> nube
  // Cada op_id se aplica una sola vez, incluso si el teléfono reintenta.
  // ======================================
  if (req.method === "POST" && pathname === "/sync/docentes") {
    let client;
    try {
      const entrada = await leerJSON(req);
      const { op_id, id_local, tipo, docente } = entrada || {};
      if (!/^[0-9a-f-]{36}$/i.test(String(op_id)) || !/^[0-9a-f-]{36}$/i.test(String(id_local)) || !["CREATE", "UPDATE", "DELETE"].includes(tipo)) {
        return responderJSON(res, 400, { error: "Operación de sincronización inválida" });
      }
      client = await pool.connect();
      await client.query("BEGIN");
      await client.query(`CREATE TABLE IF NOT EXISTS docentes_sync_ops (op_id TEXT PRIMARY KEY, respuesta JSONB NOT NULL)`);
      await client.query(`CREATE TABLE IF NOT EXISTS docentes_sync_ids (id_local TEXT PRIMARY KEY, id_remoto INTEGER NOT NULL)`);
      // Bloquea por op_id para evitar carreras entre reintentos concurrentes.
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [op_id]);
      const anterior = await client.query("SELECT respuesta FROM docentes_sync_ops WHERE op_id=$1", [op_id]);
      if (anterior.rows.length) {
        await client.query("COMMIT");
        return responderJSON(res, 200, anterior.rows[0].respuesta);
      }
      const vinculo = await client.query("SELECT id_remoto FROM docentes_sync_ids WHERE id_local=$1", [id_local]);
      let remoto = vinculo.rows[0]?.id_remoto ?? null;
      if (tipo === "CREATE") {
        if (remoto === null) {
          const d = normalizarDocente(docente);
          if (!d.apellido) throw Object.assign(new Error("Apellido obligatorio"), {status:400});
          const creado = await client.query(`INSERT INTO docentes (nombre,apellido,cargo,programa,perfil,imagen) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,[d.nombre,d.apellido,d.cargo,d.programa,d.perfil,d.imagen]);
          remoto = creado.rows[0].id;
          await client.query("INSERT INTO docentes_sync_ids (id_local,id_remoto) VALUES ($1,$2)", [id_local,remoto]);
        }
      } else if (tipo === "UPDATE") {
        if (remoto === null) throw Object.assign(new Error("No se encontró CREATE previo para este docente"),{status:409});
        const d = normalizarDocente(docente);
        if (!d.apellido) throw Object.assign(new Error("Apellido obligatorio"), {status:400});
        const r = await client.query(`UPDATE docentes SET nombre=$1,apellido=$2,cargo=$3,programa=$4,perfil=$5,imagen=$6 WHERE id=$7 RETURNING id`,[d.nombre,d.apellido,d.cargo,d.programa,d.perfil,d.imagen,remoto]);
        if (!r.rowCount) throw Object.assign(new Error("Docente remoto eliminado"),{status:409});
      } else if (tipo === "DELETE" && remoto !== null) {
        await client.query("DELETE FROM docentes WHERE id=$1", [remoto]);
        // Conservar el vínculo para reintentos y evitar recreaciones accidentales.
      }
      const respuesta = { id_remoto: remoto, sincronizado: true };
      await client.query("INSERT INTO docentes_sync_ops (op_id,respuesta) VALUES ($1,$2::jsonb)",[op_id,JSON.stringify(respuesta)]);
      await client.query("COMMIT");
      return responderJSON(res, 200, respuesta);
    } catch (error) {
      if (client) await client.query("ROLLBACK").catch(() => {});
      console.error("Error sincronizando docentes:", error);
      return responderJSON(res, error.status || 500, {error: error.status ? error.message : "No se pudo sincronizar"});
    } finally {
      if (client) client.release();
    }
  }

  // ======================================
  // GET /
  // ======================================

  if (req.method === "GET" && pathname === "/") {
    return responderJSON(res, 200, {
      servicio: "API Docentes UNINPAHU",
      estado: "Funcionando",
      endpoints: {
        docentes: "/docentes",
        buscar: "/docentes?nombre=Omar",
        detalle: "/docentes/1",
        crear: "POST /docentes",
        actualizar: "PUT /docentes/:id",
        eliminar: "DELETE /docentes/:id",
        documentacion: "/api-docs",
        openapi: "/swagger.json",
      },
    });
  }

  // ======================================
  // GET /swagger.json
  // ======================================

  if (
    req.method === "GET" &&
    pathname === "/swagger.json"
  ) {
    return responderJSON(res, 200, swaggerDocument);
  }

  // ======================================
  // GET /api-docs y /docs
  // ======================================

  if (
    req.method === "GET" &&
    (pathname === "/api-docs" || pathname === "/docs")
  ) {
    return mostrarSwagger(res);
  }

  // ======================================
  // IDENTIFICAR /docentes/:id
  // ======================================

  const coincidencia = pathname.match(
    /^\/docentes\/(\d+)$/
  );

  // ======================================
  // GET /docentes
  // GET /docentes?nombre=Omar
  // ======================================

  if (
    req.method === "GET" &&
    pathname === "/docentes"
  ) {
    try {
      const nombre = url.searchParams.get("nombre");

      let resultado;

      if (nombre && nombre.trim()) {
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

      return responderJSON(res, 200, resultado.rows);
    } catch (error) {
      console.error("Error consultando docentes:", error);

      return responderJSON(res, 500, {
        error: "Error consultando docentes",
      });
    }
  }

  // ======================================
  // GET /docentes/:id
  // ======================================

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
      console.error("Error consultando docente:", error);

      return responderJSON(res, 500, {
        error: "Error consultando docente",
      });
    }
  }

  // ======================================
  // POST /docentes
  // ======================================

  if (
    req.method === "POST" &&
    pathname === "/docentes"
  ) {
    try {
      const datos = await leerJSON(req);
      const docente = normalizarDocente(datos);

      const resultado = await pool.query(
        `
        INSERT INTO docentes
        (
          nombre,
          apellido,
          cargo,
          programa,
          perfil,
          imagen
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        `,
        [
          docente.nombre,
          docente.apellido,
          docente.cargo,
          docente.programa,
          docente.perfil,
          docente.imagen,
        ]
      );

      return responderJSON(
        res,
        201,
        resultado.rows[0]
      );
    } catch (error) {
      console.error("Error creando docente:", error);

      return responderJSON(
        res,
        error.status || 500,
        {
          error:
            error.status
              ? error.message
              : "No se pudo crear el docente",
        }
      );
    }
  }

  // ======================================
  // PUT /docentes/:id
  // ======================================

  if (
    req.method === "PUT" &&
    coincidencia
  ) {
    try {
      const id = coincidencia[1];
      const datos = await leerJSON(req);
      const docente = normalizarDocente(datos);

      // No modificamos "apellido" cuando el
      // formulario no lo envía.
      //
      // Si llega un apellido, sí lo actualizamos.
      // Los demás campos se actualizan normalmente.

      const resultado = await pool.query(
        `
        UPDATE docentes
        SET
          nombre = $1,
          apellido = COALESCE($2, apellido),
          cargo = $3,
          programa = $4,
          perfil = $5,
          imagen = $6
        WHERE id = $7
        RETURNING *
        `,
        [
          docente.nombre,
          docente.apellido,
          docente.cargo,
          docente.programa,
          docente.perfil,
          docente.imagen,
          id,
        ]
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
      console.error("Error actualizando docente:", error);

      return responderJSON(
        res,
        error.status || 500,
        {
          error:
            error.status
              ? error.message
              : "No se pudo actualizar el docente",
        }
      );
    }
  }

  // ======================================
  // DELETE /docentes/:id
  // ======================================

  if (
    req.method === "DELETE" &&
    coincidencia
  ) {
    try {
      const id = coincidencia[1];

      const resultado = await pool.query(
        `
        DELETE FROM docentes
        WHERE id = $1
        RETURNING id
        `,
        [id]
      );

      if (resultado.rows.length === 0) {
        return responderJSON(res, 404, {
          error: "Docente no encontrado",
        });
      }

      return responderJSON(res, 200, {
        mensaje: "Docente eliminado correctamente",
        id: resultado.rows[0].id,
      });
    } catch (error) {
      console.error("Error eliminando docente:", error);

      return responderJSON(res, 500, {
        error: "No se pudo eliminar el docente",
      });
    }
  }

  // ======================================
  // RUTA NO ENCONTRADA
  // ======================================

  return responderJSON(res, 404, {
    error: "Ruta no encontrada",
  });
});

// ======================================
// INICIAR SERVIDOR
// ======================================

server.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Microservicio de docentes iniciado en puerto ${PORT}`
  );
});
