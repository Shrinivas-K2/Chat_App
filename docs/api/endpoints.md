# API Endpoints

## Auth
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/google`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`

## Users
- `GET /api/v1/users/search?q=`

## Rooms
- `GET /api/v1/rooms`
- `POST /api/v1/rooms/private`
- `POST /api/v1/rooms/group`
- `DELETE /api/v1/rooms/group/:roomId`

## Messages
- `GET /api/v1/messages/room/:roomId`
- `POST /api/v1/messages`
- `PATCH /api/v1/messages/:messageId`
- `DELETE /api/v1/messages/:messageId`
- `PATCH /api/v1/messages/:messageId/seen`
