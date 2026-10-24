
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const OpenAI = require("openai");

const app = express();
const PORT = Number(process.env.PORT) || 3005;

app.use(cors());
app.use(express.json({ limit: "32kb" }));

app.use(
  "/api/ia",
  rateLimit({
    windowMs: 60 * 1000,
    limit: 30,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  })
);

// ==========================================
// CONFIGURACIÓN DE PROVEEDORES
// ==========================================

const proveedores = {
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || "gemini-3.1-flash-lite",
  },

  groq: {
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
    baseURL: "https://api.groq.com/openai/v1",
  },

  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    model: process.env.OPENROUTER_MODEL || "openrouter/free",
    baseURL: "https://openrouter.ai/api/v1",
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
  },
};

const POKEMON_API_URL =
  process.env.POKEMON_API_URL ||
  "https://pokeanime-pokemon-api.onrender.com/pokemon";

const ANIME_API_URL =
  process.env.ANIME_API_URL ||
  "https://pokeanime-anime-api.onrender.com/personajes";

const TIMEOUTS = new Set([20000, 40000, 80000, 160000]);

// ==========================================
// UTILIDADES
// ==========================================

function espera(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      return reject(
        signal.reason || new Error("Operación cancelada")
      );
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", cancelar);
      resolve();
    }, ms);

    function cancelar() {
      clearTimeout(timer);
      reject(
        signal.reason || new Error("Operación cancelada")
      );
    }

    signal?.addEventListener("abort", cancelar, {
      once: true,
    });
  });
}

async function leerJSON(url, signal) {
  const inicio = Date.now();
  let ultimoError;

  for (let intento = 1; intento <= 3; intento++) {
    try {
      console.log("[IA] Consultando:", url);

      const respuesta = await fetch(url, {
        signal,
        headers: {
          Accept: "application/json",
        },
      });

      if (!respuesta.ok) {
        const detalle = (await respuesta.text()).slice(
          0,
          350
        );

        const error = new Error(
          `API ${respuesta.status}: ${detalle}`
        );

        error.status = respuesta.status;
        throw error;
      }

      const datos = await respuesta.json();

      console.log(
        `[IA] Consulta correcta en ${(
          (Date.now() - inicio) /
          1000
        ).toFixed(1)} segundos`
      );

      return datos;
    } catch (error) {
      ultimoError = error;

      if (signal.aborted) {
        throw error;
      }

      console.warn(
        `[IA] Intento ${intento} fallido:`,
        error.message
      );

      if (
        intento === 3 ||
        (error.status && error.status < 500)
      ) {
        break;
      }

      await espera(500 * intento, signal);
    }
  }

  throw ultimoError;
}

// ==========================================
// NORMALIZACIÓN DEL CATÁLOGO
// ==========================================

function extraerLista(datos, etiquetas) {
  if (Array.isArray(datos)) {
    return datos;
  }

  if (!datos || typeof datos !== "object") {
    return [];
  }

  for (const etiqueta of etiquetas) {
    if (Array.isArray(datos[etiqueta])) {
      return datos[etiqueta];
    }

    if (Array.isArray(datos.data?.[etiqueta])) {
      return datos.data[etiqueta];
    }
  }

  if (Array.isArray(datos.data)) {
    return datos.data;
  }

  if (Array.isArray(datos.results)) {
    return datos.results;
  }

  if (Array.isArray(datos.items)) {
    return datos.items;
  }

  return [];
}

function prepararRegistros(datos, tipo) {
  const etiquetas =
    tipo === "pokemon"
      ? ["pokemon", "pokemons", "registros"]
      : [
          "personajes",
          "anime",
          "characters",
          "registros",
        ];

  return extraerLista(datos, etiquetas)
    .map((item, indice) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const id =
        item.id ??
        item._id ??
        item.id_remoto ??
        indice + 1;

      const nombre =
        item.nombre ??
        item.name ??
        item.titulo ??
        `Registro ${indice + 1}`;

      return {
        ...item,
        tipo,
        id: String(id),
        nombre: String(nombre),
        referencia: `${tipo}:${String(id)}`,
      };
    })
    .filter(Boolean);
}

async function cargarCatalogo(signal) {
  const [pokemonDatos, animeDatos] =
    await Promise.all([
      leerJSON(POKEMON_API_URL, signal),
      leerJSON(ANIME_API_URL, signal),
    ]);

  const pokemon = prepararRegistros(
    pokemonDatos,
    "pokemon"
  );

  const anime = prepararRegistros(
    animeDatos,
    "anime"
  );

  return {
    pokemon,
    anime,
    total: pokemon.length + anime.length,
  };
}

// ==========================================
// INSTRUCCIONES DE LA IA
// ==========================================

const instrucciones = `
Eres el asistente de PokeApp.

Responde exclusivamente sobre los Pokémon y
personajes de anime que aparecen en el catálogo
JSON suministrado en el mensaje del usuario.

No inventes registros, propiedades, estadísticas,
habilidades, historias ni relaciones.

Puedes responder comparaciones y recuentos
usando únicamente los datos registrados.

Si la pregunta no puede contestarse con los
datos disponibles, indica claramente la limitación.

Si la pregunta no trata del catálogo, responde
que solo puedes ayudar con Pokémon y personajes
de anime registrados en PokeApp.

Devuelve exclusivamente un objeto JSON válido
con estas propiedades:

{
  "dentro_contexto": true,
  "respuesta": "Texto breve y claro en español",
  "referencias": ["pokemon:1"]
}

Usa dentro_contexto=false cuando la consulta
sea ajena al catálogo o no pueda responderse
con los registros.

En referencias incluye solo valores exactos
de la propiedad referencia de los registros
que hayas utilizado.

Si no hay referencias, usa [].

No añadas texto fuera del JSON.
`;

// ==========================================
// INTERPRETACIÓN DE RESPUESTAS JSON
// ==========================================

function interpretarJSON(contenido) {
  if (
    typeof contenido !== "string" ||
    !contenido.trim()
  ) {
    throw new Error(
      "El modelo devolvió una respuesta vacía."
    );
  }

  const limpio = contenido
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    return JSON.parse(limpio);
  } catch (_) {
    const inicio = limpio.indexOf("{");
    const fin = limpio.lastIndexOf("}");

    if (inicio >= 0 && fin > inicio) {
      try {
        return JSON.parse(
          limpio.slice(inicio, fin + 1)
        );
      } catch (_) {
        // Se informa el error más abajo.
      }
    }

    throw new Error(
      "El modelo no devolvió JSON válido."
    );
  }
}

function validarResultado(resultado, catalogo) {
  if (
    !resultado ||
    typeof resultado !== "object" ||
    Array.isArray(resultado)
  ) {
    throw new Error(
      "La respuesta del modelo no es un objeto JSON."
    );
  }

  if (
    typeof resultado.dentro_contexto !== "boolean" ||
    typeof resultado.respuesta !== "string" ||
    !resultado.respuesta.trim() ||
    !Array.isArray(resultado.referencias)
  ) {
    throw new Error(
      "La respuesta del modelo no cumple la estructura requerida."
    );
  }

  const permitidas = new Set(
    [...catalogo.pokemon, ...catalogo.anime].map(
      (registro) => registro.referencia
    )
  );

  const referencias = [
    ...new Set(
      resultado.referencias.filter(
        (ref) =>
          typeof ref === "string" &&
          permitidas.has(ref)
      )
    ),
  ];

  return {
    dentro_contexto: resultado.dentro_contexto,
    respuesta: resultado.respuesta.trim(),
    referencias,
  };
}

// ==========================================
// GEMINI - API NATIVA DE GOOGLE
// ==========================================

async function consultarGemini(
  config,
  catalogo,
  pregunta,
  signal
) {
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    `${encodeURIComponent(config.model)}:generateContent`;

  const respuesta = await fetch(url, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": config.apiKey,
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text: instrucciones,
          },
        ],
      },

      contents: [
        {
          role: "user",
          parts: [
            {
              text: JSON.stringify({
                catalogo,
                pregunta,
              }),
            },
          ],
        },
      ],

      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
        maxOutputTokens: 1400,
      },
    }),
  });

  const cuerpo = await respuesta.text();

  let datos;

  try {
    datos = JSON.parse(cuerpo);
  } catch {
    datos = {};
  }

  if (!respuesta.ok) {
    const error = new Error(
      datos.error?.message ||
        `Gemini devolvió HTTP ${
          respuesta.status
        }: ${cuerpo.slice(0, 250)}`
    );

    error.status = respuesta.status;

    throw error;
  }

  const candidato = datos.candidates?.[0];

  const contenido =
    candidato?.content?.parts
      ?.map((parte) => parte.text || "")
      .join("") || "";

  console.log(
    "[IA gemini] Motivo de finalización:",
    candidato?.finishReason || "desconocido"
  );

  if (
    candidato?.finishReason &&
    candidato.finishReason !== "STOP"
  ) {
    throw new Error(
      `Gemini interrumpió la respuesta: ${
        candidato.finishReason
      }`
    );
  }

  return contenido;
}

// ==========================================
// GROQ, OPENROUTER Y OPENAI
// ==========================================

async function consultarCompatibleOpenAI(
  proveedor,
  config,
  catalogo,
  pregunta,
  timeout,
  signal
) {
  const cliente = new OpenAI({
    apiKey: config.apiKey,
    ...(config.baseURL
      ? { baseURL: config.baseURL }
      : {}),
    timeout,
    maxRetries: 0,
  });

  const opciones = {
    model: config.model,

    messages: [
      {
        role: "system",
        content: instrucciones,
      },
      {
        role: "user",
        content: JSON.stringify({
          catalogo,
          pregunta,
        }),
      },
    ],

    temperature: 0.2,
    max_tokens: 1400,
  };

  // OpenRouter/free puede seleccionar modelos
  // que no admiten response_format json_object.
  if (proveedor !== "openrouter") {
    opciones.response_format = {
      type: "json_object",
    };
  }

  const resultado =
    await cliente.chat.completions.create(
      opciones,
      { signal }
    );

  const eleccion = resultado.choices?.[0];
  const contenido = eleccion?.message?.content;

  console.log(
    `[IA ${proveedor}] Modelo real:`,
    resultado.model || config.model
  );

  console.log(
    `[IA ${proveedor}] Motivo de finalización:`,
    eleccion?.finish_reason || "desconocido"
  );

  if (eleccion?.finish_reason === "length") {
    throw new Error(
      "El modelo agotó los tokens antes de completar la respuesta."
    );
  }

  if (
    typeof contenido !== "string" ||
    !contenido.trim()
  ) {
    console.warn(
      `[IA ${proveedor}] Respuesta sin contenido:`,
      JSON.stringify(
        eleccion?.message || {}
      ).slice(0, 700)
    );

    throw new Error(
      "El modelo devolvió una respuesta vacía."
    );
  }

  console.log(
    `[IA ${proveedor}] Vista previa de respuesta:`,
    contenido.slice(0, 300)
  );

  return contenido;
}

// ==========================================
// MANEJO DE ERRORES
// ==========================================

function responderError(res, error, proveedor) {
  const estado = Number(
    error.status || error.statusCode
  );

  console.error(
    `[IA ${proveedor || "servidor"}]`,
    error
  );

  let http = 502;
  let mensaje =
    error.message ||
    "Error al consultar el asistente.";

  if (
    error.name === "AbortError" ||
    error.name === "TimeoutError" ||
    /abort|timeout|tiempo de espera/i.test(mensaje)
  ) {
    http = 504;
    mensaje =
      "La consulta superó el tiempo máximo configurado.";
  } else if (estado === 429) {
    http = 429;
    mensaje =
      "El proveedor alcanzó su límite de solicitudes o cuota. Intenta más tarde.";
  } else if (estado === 503) {
    http = 503;
    mensaje =
      "El proveedor de IA no está disponible temporalmente o presenta alta demanda.";
  } else if (
    estado === 401 ||
    estado === 403
  ) {
    http = 502;
    mensaje =
      "El proveedor rechazó las credenciales o los permisos configurados.";
  } else if (estado === 404) {
    http = 502;
    mensaje =
      "El modelo seleccionado no está disponible para esta clave o proveedor.";
  } else if (estado === 400) {
    http = 502;
    mensaje =
      "El proveedor rechazó los parámetros de la solicitud.";
  } else if (estado >= 500) {
    http = 503;
    mensaje =
      "El proveedor de IA presentó un error temporal.";
  }

  return res.status(http).json({
    error: mensaje,
    proveedor: proveedor || null,
  });
}

// ==========================================
// RUTA DE ESTADO
// ==========================================

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    servicio: "PokeApp IA",

    proveedores: Object.fromEntries(
      Object.entries(proveedores).map(
        ([nombre, config]) => [
          nombre,
          {
            configurado: Boolean(config.apiKey),
            modelo: config.model,
          },
        ]
      )
    ),

    tiempos_permitidos_segundos: [
      20, 40, 80, 160,
    ],
  });
});

// ==========================================
// CONSULTAR CATÁLOGO
// ==========================================

app.get("/api/ia/catalogo", async (_req, res) => {
  const controller = new AbortController();

  const timer = setTimeout(
    () => controller.abort(),
    30000
  );

  try {
    const catalogo = await cargarCatalogo(
      controller.signal
    );

    return res.json(catalogo);
  } catch (error) {
    return responderError(
      res,
      error,
      "catalogo"
    );
  } finally {
    clearTimeout(timer);
  }
});

// ==========================================
// CONSULTAR INTELIGENCIA ARTIFICIAL
// ==========================================

app.post("/api/ia/preguntar", async (req, res) => {
  const {
    pregunta,
    proveedor = "groq",
    timeout = 40000,
  } = req.body || {};

  if (
    typeof pregunta !== "string" ||
    !pregunta.trim() ||
    pregunta.length > 500
  ) {
    return res.status(400).json({
      error:
        "La pregunta debe contener entre 1 y 500 caracteres.",
    });
  }

  if (
    !Object.prototype.hasOwnProperty.call(
      proveedores,
      proveedor
    )
  ) {
    return res.status(400).json({
      error: "Proveedor no permitido.",
      proveedores: Object.keys(proveedores),
    });
  }

  const config = proveedores[proveedor];

  if (!config.apiKey) {
    return res.status(503).json({
      error:
        `Falta configurar la clave API del proveedor ${proveedor}.`,
    });
  }

  const timeoutMs = Number(timeout);

  // Acepta segundos o milisegundos.
  const tiempo = TIMEOUTS.has(timeoutMs)
    ? timeoutMs
    : TIMEOUTS.has(timeoutMs * 1000)
    ? timeoutMs * 1000
    : null;

  if (!tiempo) {
    return res.status(400).json({
      error:
        "Timeout no válido. Usa 20, 40, 80 o 160 segundos.",
    });
  }

  const controller = new AbortController();

  const timer = setTimeout(
    () => controller.abort(),
    tiempo
  );

  try {
    const catalogo = await cargarCatalogo(
      controller.signal
    );

    if (catalogo.total === 0) {
      return res.status(503).json({
        error:
          "Las APIs respondieron, pero el catálogo no contiene registros reconocibles.",
      });
    }

    console.log(
      "[IA] Proveedor:",
      proveedor
    );

    console.log(
      "[IA] Modelo:",
      config.model
    );

    console.log(
      "[IA] Timeout:",
      `${tiempo / 1000}s`
    );

    let contenido;

    if (proveedor === "gemini") {
      contenido = await consultarGemini(
        config,
        catalogo,
        pregunta.trim(),
        controller.signal
      );
    } else {
      contenido =
        await consultarCompatibleOpenAI(
          proveedor,
          config,
          catalogo,
          pregunta.trim(),
          tiempo,
          controller.signal
        );
    }

    const resultado = validarResultado(
      interpretarJSON(contenido),
      catalogo
    );

    return res.json({
      ...resultado,
      proveedor,
      modelo: config.model,
    });
  } catch (error) {
    return responderError(
      res,
      error,
      proveedor
    );
  } finally {
    clearTimeout(timer);
  }
});

// ==========================================
// ERRORES DE EXPRESS
// ==========================================

app.use((error, _req, res, _next) => {
  console.error(
    "[IA] Error Express:",
    error
  );

  res.status(400).json({
    error: "Solicitud inválida.",
  });
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================

app.listen(PORT, () => {
  console.log(
    `PokeApp IA escuchando en puerto ${PORT}`
  );

  console.log(
    "Proveedores disponibles:",
    Object.keys(proveedores).join(", ")
  );
});
