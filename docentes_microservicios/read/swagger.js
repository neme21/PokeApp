
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerSpec = swaggerJsdoc({
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Microservicio READ - Docentes',
            version: '1.0.0',
            description:
                'API independiente para consultar docentes en PostgreSQL'
        },
        servers: [
            {
                url: '/'
            }
        ],
        components: {
            schemas: {
                Docente: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            example: 1
                        },
                        nombre: {
                            type: 'string',
                            example: 'Omar Andrés'
                        },
                        apellido: {
                            type: 'string',
                            example: 'Bonilla Acosta'
                        },
                        cargo: {
                            type: 'string',
                            nullable: true,
                            example: 'Docente Líder'
                        },
                        programa: {
                            type: 'string',
                            nullable: true,
                            example: 'Ingeniería y Tecnologías de la Información'
                        },
                        perfil: {
                            type: 'string',
                            nullable: true
                        },
                        imagen: {
                            type: 'string',
                            nullable: true
                        }
                    }
                }
            }
        }
    },
    apis: ['./server.js']
});

module.exports = swaggerSpec;
