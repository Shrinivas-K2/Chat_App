const { Server } = require("socket.io");
const { CLIENT_ORIGIN } = require("../../config/env");
const { query } = require("../../config/db");
const { verifyToken } = require("../../utils/jwt");
const { setIO } = require("./socketState");

function initSocketServer(server) {
  const io = new Server(server, {
    cors: {
      origin: CLIENT_ORIGIN.split(",").map((origin) => origin.trim()),
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Unauthorized"));

      const decoded = verifyToken(token);
      const userResult = await query(
        `
        SELECT u.user_id, u.username
        FROM users u
        JOIN user_sessions s ON s.user_id = u.user_id
        WHERE u.user_id = $1
          AND s.jwt_token = $2
          AND s.is_valid = TRUE
          AND s.expires_at > NOW()
        LIMIT 1
        `,
        [decoded.sub, token]
      );

      if (userResult.rowCount === 0) {
        return next(new Error("Unauthorized"));
      }

      socket.user = userResult.rows[0];
      return next();
    } catch (error) {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    const user = socket.user;
    if (!user) return;

    const userRoom = `user:${user.user_id}`;
    socket.join(userRoom);

    try {
      await query(
        `
        UPDATE users
        SET is_online = TRUE, updated_at = NOW()
        WHERE user_id = $1
        `,
        [user.user_id]
      );

      const roomsResult = await query(
        `
        SELECT room_id
        FROM room_members
        WHERE user_id = $1
          AND status = 'APPROVED'
        `,
        [user.user_id]
      );

      roomsResult.rows.forEach((row) => socket.join(row.room_id));

      socket.broadcast.emit("user:online", { userId: user.user_id });
    } catch (error) {
      console.error("Socket setup failed", error);
    }

    socket.on("typing:update", ({ chatId, userName, isTyping }) => {
      if (!chatId) return;
      socket.to(chatId).emit("typing:update", { chatId, userName, isTyping });
    });

    socket.on("room:join", async ({ roomId }) => {
      if (!roomId) return;

      try {
        const membership = await query(
          `
          SELECT 1
          FROM room_members rm
          JOIN rooms r ON r.room_id = rm.room_id
          WHERE rm.room_id = $1
            AND rm.user_id = $2
            AND rm.status = 'APPROVED'
            AND r.is_active = TRUE
          LIMIT 1
          `,
          [roomId, user.user_id]
        );

        if (membership.rowCount === 0) return;

        socket.join(roomId);
        socket.emit("room:joined", { roomId });
      } catch (error) {
        console.error("Failed room:join", error);
      }
    });

    socket.on("room:leave", ({ roomId }) => {
      if (!roomId) return;
      socket.leave(roomId);
    });

    socket.on("message:seen", async ({ chatId, messageId }) => {
      if (!chatId || !messageId) return;

      try {
        await query(
          `
          INSERT INTO message_status (message_id, user_id, status)
          VALUES ($1, $2, 'SEEN')
          ON CONFLICT (message_id, user_id)
          DO UPDATE SET status = 'SEEN', updated_at = NOW()
          `,
          [messageId, user.user_id]
        );

        io.to(chatId).emit("message:status", {
          chatId,
          messageId,
          status: "seen",
          userId: user.user_id,
        });
      } catch (error) {
        console.error("Failed message:seen", error);
      }
    });

    socket.on("disconnect", async () => {
      try {
        await query(
          `
          UPDATE users
          SET is_online = FALSE, last_seen = NOW(), updated_at = NOW()
          WHERE user_id = $1
          `,
          [user.user_id]
        );

        socket.broadcast.emit("user:offline", { userId: user.user_id });
      } catch (error) {
        console.error("Failed socket disconnect cleanup", error);
      }
    });
  });

  setIO(io);
  return io;
}

module.exports = { initSocketServer };
