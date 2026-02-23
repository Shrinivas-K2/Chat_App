# Frontend (React + Vite)

## Run
1. `cd frontend`
2. Copy `.env.example` to `.env`
3. `npm install`
4. `npm run dev`

## Backend integration
Frontend consumes backend APIs at `VITE_API_BASE_URL`, realtime socket at `VITE_SOCKET_URL`, and Google auth via `VITE_GOOGLE_CLIENT_ID`.

## Current implementation
- JWT-based auth screens
- Google sign-in on login and signup screens
- Protected routing
- Room list from backend
- Room message fetch/send/edit/delete
- Message seen updates
- Group create/delete
- Typing indicator + notifications over Socket.IO
- Search users via backend and messages locally
