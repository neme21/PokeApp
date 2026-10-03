module.exports = {
  openapi: "3.0.0",

  info: {
    title: "API Docentes UNINPAHU",
    version: "1.0.0",
    description:
      "Microservicio para consultar docentes.",
  },

  servers: [
    {
      url: "/",
      description: "Servidor actual",
    },
  ],

  paths: {
    "/docentes": {
      get: {
        summary: "Obtener docentes",
        description:
          "Devuelve todos los docentes o permite buscar por nombre.",

        parameters: [
          {
            name: "nombre",
            in: "query",
            required: false,
            description:
              "Nombre o parte del nombre del docente",

            schema: {
              type: "string",
            },
          },
        ],

        responses: {
          200: {
            description:
              "Lista de docentes",
          },

          500: {
            description:
              "Error del servidor",
          },
        },
      },
    },

    "/docentes/{id}": {
      get: {
        summary:
          "Obtener un docente por ID",

        parameters: [
          {
            name: "id",
            in: "path",
            required: true,

            schema: {
              type: "integer",
            },
          },
        ],

        responses: {
          200: {
            description:
              "Información del docente",
          },

          404: {
            description:
              "Docente no encontrado",
          },

          500: {
            description:
              "Error del servidor",
          },
        },
      },
    },
  },
};