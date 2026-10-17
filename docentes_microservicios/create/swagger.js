
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerSpec = swaggerJsdoc({
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Microservicio CREATE - Docentes',
            version: '1.0.0',
            description:
                'API independiente para registrar docentes en PostgreSQL'
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
