# Frontend Architecture

## Layers
1. `app/` - app shell and root layout
2. `routes/` - route definitions and protected route logic
3. `features/` - domain modules (auth, chat, message, group, media, notifications)
4. `components/` - reusable UI and layout pieces
5. `services/` - HTTP client, socket client, browser storage
6. `store/` - global state orchestration
7. `providers/` - auth/socket/theme providers

## Key responsibilities
- Auth pages and session handling: `features/auth`
- Realtime chat screens: `features/chat`, `features/messages`
- Group flows: `features/groups`
- Media upload UI: `features/media`
- Notification UI and state: `features/notifications`
- Online status and typing indicators: `features/presence`
