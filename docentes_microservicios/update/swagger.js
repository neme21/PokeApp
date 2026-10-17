
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerSpec = swaggerJsdoc({
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Microservicio UPDATE - Docentes',
            version: '1.0.0',
            description:
                'API independiente para actualizar docentes en PostgreSQL'
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
