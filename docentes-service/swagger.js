module.exports = {
  openapi: "3.0.0",

  info: {
    title: "API Docentes UNINPAHU",
    version: "1.0.0",
    description: "Microservicio CRUD de docentes.",
  },

  servers: [
    {
      url: "/",
      description: "Servidor actual",
    },
  ],

  components: {
    schemas: {
      DocenteEntrada: {
        type: "object",
        required: ["nombre"],
        properties: {
          nombre: {
            type: "string",
            example: "Nuevo docente",
          },
          cargo: {
            type: "string",
            example: "Docente de Ingeniería",
          },
          programa: {
            type: "string",
            example: "Ingeniería y Tecnologías de la Información",
          },
          descripcion: {
            type: "string",
            example: "Docente especializado en desarrollo de software.",
          },
          imagen: {
            type: "string",
            example: "https://ejemplo.com/docente.jpg",
          },
        },
      },
    },
  },

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
            description: "Nombre o parte del nombre del docente",
            schema: {
              type: "string",
            },
          },
        ],

        responses: {
          200: {
            description: "Lista de docentes",
          },
          500: {
            description: "Error del servidor",
          },
        },
      },

      post: {
        summary: "Crear docente",
        description: "Registra un nuevo docente en la base de datos.",

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/DocenteEntrada",
              },
            },
          },
        },

        responses: {
          201: {
            description: "Docente creado correctamente",
          },
          400: {
            description: "Datos inválidos",
          },
          500: {
            description: "Error del servidor",
          },
        },
      },
    },

    "/docentes/{id}": {
      get: {
        summary: "Obtener un docente por ID",
        description: "Consulta la información de un docente específico.",

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
            description: "Información del docente",
          },
          404: {
            description: "Docente no encontrado",
          },
          500: {
            description: "Error del servidor",
          },
        },
      },

      put: {
        summary: "Actualizar docente",
        description: "Actualiza la información de un docente existente.",

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

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/DocenteEntrada",
              },
            },
          },
        },

        responses: {
          200: {
            description: "Docente actualizado correctamente",
          },
          400: {
            description: "Datos inválidos",
          },
          404: {
            description: "Docente no encontrado",
          },
          500: {
            description: "Error del servidor",
          },
        },
      },

      delete: {
        summary: "Eliminar docente",
        description: "Elimina un docente de la base de datos.",

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
            description: "Docente eliminado correctamente",
          },
          404: {
            description: "Docente no encontrado",
          },
          500: {
            description: "Error del servidor",
          },
        },
      },
    },
  },
};