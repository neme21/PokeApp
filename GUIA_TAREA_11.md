# Tarea 11 - IA multiproveedor y timeout configurable

## Proveedores
- Gemini (selección predeterminada): https://aistudio.google.com/apikey
- Groq: https://console.groq.com/keys
- Cerebras: https://cloud.cerebras.ai/
- OpenAI: opcional; puede requerir saldo.

Los niveles gratuitos tienen límites de uso y disponibilidad según modelo y cuenta. Si un modelo deja de estar disponible, cambia la variable `*_MODEL` en el `.env` del backend.

## Archivos modificados
- `app/(tabs)/asistente.tsx`: botones Gemini, Groq, Cerebras, OpenAI y 20/40/80/160 segundos.
- `services/asistenteService.ts`: envía proveedor y timeout al backend.
- `ia-service/server.js`: conecta con las cuatro API mediante el SDK compatible de OpenAI.
- `ia-service/.env.example`: nombres de las claves y modelos.

## Puesta en marcha
1. En `ia-service`, ejecuta `npm install`.
2. Crea `ia-service/.env` usando `.env.example`; coloca las claves de los proveedores que quieras probar. No subas `.env` a GitHub.
3. Conserva las URLs **reales** de Pokémon y Anime en `POKEMON_API_URL` y `ANIME_API_URL`.
4. Inicia backend con `npm start` desde `ia-service`.
5. Configura `EXPO_PUBLIC_IA_API_URL` en `.env` de la raíz (Android físico: `http://IP_DEL_PC:3005`; web: `http://localhost:3005`).
6. Inicia Expo: `npx expo start -c`.
7. Selecciona proveedor y tiempo desde Asistente y consulta un Pokémon o personaje registrado.

## Consideraciones
- Las claves permanecen en el backend; no se distribuyen al celular.
- Se mantiene el filtro de contexto Pokémon/Anime.
- El timeout se aplica en el frontend y backend.
- Las API gratuitas pueden devolver 429 por límites de uso. OpenAI no es necesario para probar las tres alternativas gratuitas.
- Las rutas y credenciales locales no se incluyen en el ZIP. Mantén una copia de tu proyecto actual.
