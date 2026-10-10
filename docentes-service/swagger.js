module.exports = {
  openapi: "3.0.0",

  info: {
    title: "API Docentes UNINPAHU",
    version: "1.0.0",
    description:
<<<<<<< HEAD
      "Microservicio para consultar docentes.",
=======
      "Microservicio CRUD de docentes.",
>>>>>>> cb24961 (ff)
  },

  servers: [
    {
      url: "/",
      description: "Servidor actual",
    },
  ],

<<<<<<< HEAD
  paths: {
    "/docentes": {
=======
  components:{schemas:{DocenteEntrada:{type:"object",required:["nombre"],properties:{
    nombre:{type:"string",example:"Nuevo docente"},cargo:{type:"string"},programa:{type:"string"},descripcion:{type:"string"},imagen:{type:"string"}
  }}}},
  paths: {
    "/docentes": {
      post: {
        summary: "Crear docente", requestBody: { required:true, content:{ "application/json":{ schema:{ $ref:"#/components/schemas/DocenteEntrada" } } } },
        responses:{ 201:{description:"Docente creado"},400:{description:"Datos inválidos"} }
      },
>>>>>>> cb24961 (ff)
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
<<<<<<< HEAD
=======
      put: {
        summary:"Actualizar docente", parameters:[{name:"id",in:"path",required:true,schema:{type:"integer"}}],
        requestBody:{required:true,content:{"application/json":{schema:{$ref:"#/components/schemas/DocenteEntrada"}}}},
        responses:{200:{description:"Docente actualizado"},404:{description:"No encontrado"}}
      },
      delete: {
        summary:"Eliminar docente",parameters:[{name:"id",in:"path",required:true,schema:{type:"integer"}}],
        responses:{200:{description:"Docente eliminado"},404:{description:"No encontrado"}}
      },
>>>>>>> cb24961 (ff)
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