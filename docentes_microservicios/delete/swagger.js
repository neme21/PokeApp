
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerSpec = swaggerJsdoc({
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Microservicio DELETE - Docentes',
            version: '1.0.0',
            description:
                'API independiente para eliminar docentes de PostgreSQL'
        },
        servers: [
            {
                url: '/'
            }
        ]
    },
    apis: ['./server.js']
});

module.exports = swaggerSpec;
