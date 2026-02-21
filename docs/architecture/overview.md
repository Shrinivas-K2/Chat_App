# System Overview

- Frontend and backend are separated for independent scaling and deployment.
- Use REST APIs for CRUD operations and Socket.IO for realtime events.
- Shared contracts under `shared/` prevent payload mismatches.
- Optional Redis supports multi-instance socket scaling.
