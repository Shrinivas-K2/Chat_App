# Backend (Node + Express + pg + JWT)

## Run
1. `cd backend`
2. Copy `.env.example` to `.env`
3. Ensure PostgreSQL is running on your configured host/port
4. Import schema: `psql -U postgres -d chat_app -f Chat_App.sql`
5. `npm install`
6. `npm run dev`

## Environment
Default `.env.example` is aligned to your provided values:
- `DB_PORT=5432`
- `DB_NAME=chat_app`
- `DB_USER=postgres`
- `DB_PASSWORD=Pes123`
- `GOOGLE_CLIENT_ID=<your-google-web-client-id>`

If `DB_HOST=*` is used, backend normalizes it to `localhost`.

## Implemented APIs
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/google`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`
- `GET /api/v1/users/search?q=`
- `GET /api/v1/rooms`
- `POST /api/v1/rooms/private`
- `POST /api/v1/rooms/group`
- `DELETE /api/v1/rooms/group/:roomId`
- `GET /api/v1/messages/room/:roomId`
- `POST /api/v1/messages`
- `PATCH /api/v1/messages/:messageId`
- `DELETE /api/v1/messages/:messageId`
- `PATCH /api/v1/messages/:messageId/seen`

## Socket events
- `typing:update`
- `message:new`
- `message:updated`
- `message:deleted`
- `message:status`
- `notification:new`
