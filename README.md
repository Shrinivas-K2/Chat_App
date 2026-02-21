# Realtime Chat Application

Monorepo structure:
- `frontend/` React + Vite client
- `backend/` Node + Express + PostgreSQL + Socket.IO
- `shared/` shared contracts/constants
- `docs/` architecture and API notes

## Quick start
1. Import schema
   - `cd backend`
   - `psql -U postgres -d chat_app -f Chat_App.sql`
2. Start backend
   - `cd backend`
   - `copy .env.example .env`
   - `npm install`
   - `npm run dev`
3. Start frontend
   - `cd frontend`
   - `copy .env.example .env`
   - `npm install`
   - `npm run dev`
