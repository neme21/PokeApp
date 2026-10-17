# Fase 1: cuatro microservicios independientes de docentes

Estos cuatro proyectos son desplegables por separado en Render (tipo Web Service). Cada uno utiliza la MISMA `DATABASE_URL` de PostgreSQL y tiene su propio endpoint `/health`.

| Servicio | Ruta | Método |
|---|---|---|
| create | `/docentes` | POST |
| read | `/docentes`, `/docentes/:id` | GET |
| update | `/docentes/:id` | PUT |
| delete | `/docentes/:id` | DELETE |

En Render, crear cuatro Web Services, cada uno con su **Root Directory** correspondiente (`docentes_microservicios/create`, etc.), Build Command `npm install` y Start Command `npm start`. Establecer `DATABASE_URL` en cada uno. No subir `.env` con credenciales.

Los servicios de escritura exigen la cabecera `Idempotency-Key` con un UUID único por operación. Repetir la misma operación con la misma clave devuelve la misma respuesta; es importante para sincronización offline.

**Limitación de esta fase:** estos servicios todavía no sustituyen el endpoint `/sync/docentes` usado por la app actual. No desplegar y eliminar el servicio anterior hasta adaptar el cliente móvil, las tablas de mapeo `id_local`→`id_remoto`, la reconciliación nube→SQLite, el manejo de conflictos y las banderas `NUEVO`. Tampoco se ha implementado Swagger ni el mecanismo de cambios remotos. Para detectar eliminaciones remotas de forma fiable se necesitará un registro de cambios/tombstones en PostgreSQL.

**Importante:** los cuatro servicios comparten PostgreSQL, por lo que no hay aislamiento de fallos de la base de datos. Los endpoints de escritura no están autenticados: configurar autenticación/autorización antes de exponerlos a usuarios reales.
