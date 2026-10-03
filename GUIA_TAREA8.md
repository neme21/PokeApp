# PokeAnime - Tarea 8

## Componentes incluidos
- App React Native/Expo Router basada en PokeApp.
- `backend/`: Node.js + Express + PostgreSQL + Swagger (`/api-docs`).
- `anime-service/`: Python + FastAPI + MongoDB + Swagger automático (`/docs`).
- 10 Pokémon en `backend/db/seed.sql`.
- 10 personajes anime en `anime-service/seed.json`.

## Variables de entorno
Copia `.env.example` a `.env` en la raíz y coloca las URLs públicas. En cada microservicio copia también su `.env.example` a `.env`. Nunca subas contraseñas reales al repositorio.

## Pokémon local
```bash
cd backend
npm install
# configura DATABASE_URL en .env
npm run db:init
npm start
```
Swagger: http://localhost:3000/api-docs

## Anime local
```bash
cd anime-service
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
# configura MONGODB_URI en .env
python seed.py
uvicorn main:app --reload
```
Swagger: http://localhost:8000/docs

## App
```bash
npm install
npx expo start
```

## Endpoints
- Pokémon: `GET /pokemon`, `GET /pokemon/{nombre_o_id}`
- Anime: `GET /personajes`, `GET /personajes/{nombre_o_id}`
