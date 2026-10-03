const swagger = {
  openapi: "3.0.0",

  info: {
    title: "API Docentes UNINPAHU",
    version: "1.0.0",
    description: "Microservicio para consultar docentes de UNINPAHU"
  },

  paths: {
    "/docentes": {
      get: {
        summary: "Listar o buscar docentes",

        parameters: [
          {
            name: "nombre",
            in: "query",
            required: false,
            schema: {
              type: "string"
            }
          }
        ],

        responses: {
          200: {
            description: "Consulta realizada correctamente"
          }
        }
      }
    },

    "/docentes/{id}": {
      get: {
        summary: "Buscar docente por ID",

        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer"
            }
          }
        ],

        responses: {
          200: {
            description: "Docente encontrado"
          },
          404: {
            description: "Docente no encontrado"
          }
        }
      }
    }
  }
};

module.exports = swagger;


