# Tarea 9 — CRUD docentes

## API y Swagger
Servicio existente en Render: https://pokeanime-docentes-api.onrender.com
Swagger (verificar después del despliegue): https://pokeanime-docentes-api.onrender.com/api-docs

Endpoints: GET /docentes, GET /docentes/:id, POST /docentes, PUT /docentes/:id, DELETE /docentes/:id.

## Despliegue
1. Subir cambios a GitHub.
2. En Render, redesplegar `pokeanime-docentes-api` desde la rama actual.
3. Mantener `DATABASE_URL` configurada en Render (no incluir credenciales en GitHub).
4. Verificar Swagger y probar CRUD con un docente de prueba.
5. Ejecutar Expo con `npm install` y `npx expo start`.

## Evidencias PDF
Capturar: listado, alta, consulta detalle, edición, eliminación, Swagger GET/POST/PUT/DELETE, y URL pública de Render.

Nota: este proyecto implementa un servicio de docentes separado de los servicios de Pokémon y anime; si el docente exige cuatro servicios desplegados por separado, habría que dividir este servicio.
