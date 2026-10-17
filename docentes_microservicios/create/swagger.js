const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Microservicio READ - Docentes',
            version: '1.0.0',
            description: 'creacion en PostgreSQL'
        },
        servers: [
            {
                url: 'https://docente-read.onrender.com'
            }
        ]
    },
    apis: ['./server.js']
};

module.exports = swaggerJsdoc(options);