# Backend Architecture

## Layers
1. `routes/` - HTTP route registry
2. `controllers/` - request/response orchestration
3. `modules/*/` - business logic services by domain
4. `repositories/` - data access abstractions
5. `models/` - database schemas/entities
6. `sockets/` - socket event handlers and rooms
7. `services/` - integrations (storage, queue, socket broadcast)
8. `middlewares/` - auth, validation, error handling

## Realtime flow
- User connects via Socket.IO with JWT handshake
- Socket joins personal room and chat/group rooms
- Message create endpoint persists message
- Socket broadcast emits `message:new`, `message:delivered`, `message:seen`
- Presence updates emit `user:online`, `user:offline`, `typing:start`, `typing:stop`
