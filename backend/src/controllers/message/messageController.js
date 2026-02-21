const { pool, query } = require("../../config/db");
const { getIO } = require("../../services/socket/socketState");

function mapMessage(row) {
  return {
    id: row.message_id,
    chatId: row.room_id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    text: row.is_deleted ? "This message was deleted." : row.encrypted_content,
    messageType: (row.message_type || "TEXT").toLowerCase(),
    timestamp: row.created_at,
    status: (row.status || "SENT").toLowerCase(),
    edited: Boolean(row.is_edited),
    deleted: Boolean(row.is_deleted),
  };
}

async function assertMembership(roomId, userId) {
  const membership = await query(
    `
    SELECT
      r.room_type,
      MAX(CASE WHEN rm.user_id = $2 AND rm.status = 'APPROVED' THEN 1 ELSE 0 END) AS is_user_approved,
      SUM(CASE WHEN rm.status = 'APPROVED' THEN 1 ELSE 0 END) AS approved_count
    FROM rooms r
    JOIN room_members rm ON rm.room_id = r.room_id
    WHERE r.room_id = $1
      AND r.is_active = TRUE
    GROUP BY r.room_type
    `,
    [roomId, userId]
  );

  if (membership.rowCount === 0) {
    return false;
  }

  const row = membership.rows[0];
  const isUserApproved = Number(row.is_user_approved) === 1;
  if (!isUserApproved) {
    return false;
  }

  if (row.room_type === "PRIVATE") {
    return Number(row.approved_count) >= 2;
  }

  return true;
}

async function listMessagesByRoom(req, res) {
  const { roomId } = req.params;

  const isMember = await assertMembership(roomId, req.user.user_id);
  if (!isMember) {
    return res.status(403).json({ message: "Access denied" });
  }

  const result = await query(
    `
    SELECT
      m.message_id,
      m.room_id,
      m.sender_id,
      u.username AS sender_name,
      m.encrypted_content,
      m.message_type,
      m.is_edited,
      m.is_deleted,
      m.created_at,
      COALESCE(ms.status, 'SENT') AS status
    FROM messages m
    LEFT JOIN users u ON u.user_id = m.sender_id
    LEFT JOIN message_status ms
      ON ms.message_id = m.message_id
     AND ms.user_id = $1
    WHERE m.room_id = $2
    ORDER BY m.created_at ASC
    LIMIT 500
    `,
    [req.user.user_id, roomId]
  );

  return res.json({ messages: result.rows.map(mapMessage) });
}

async function sendMessage(req, res) {
  const { roomId, text, messageType = "TEXT" } = req.body;

  if (!roomId || !text || !String(text).trim()) {
    return res.status(400).json({ message: "roomId and text are required" });
  }

  const isMember = await assertMembership(roomId, req.user.user_id);
  if (!isMember) {
    return res.status(403).json({ message: "Access denied" });
  }

  const type = String(messageType).toUpperCase();
  const allowed = ["TEXT", "IMAGE", "FILE", "VOICE"];
  if (!allowed.includes(type)) {
    return res.status(400).json({ message: "Invalid messageType" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const messageResult = await client.query(
      `
      INSERT INTO messages (room_id, sender_id, encrypted_content, message_type)
      VALUES ($1, $2, $3, $4)
      RETURNING message_id, room_id, sender_id, encrypted_content, message_type, is_edited, is_deleted, created_at
      `,
      [roomId, req.user.user_id, text.trim(), type]
    );

    const message = messageResult.rows[0];

    const memberResult = await client.query(
      `
      SELECT user_id
      FROM room_members
      WHERE room_id = $1
        AND status = 'APPROVED'
      `,
      [roomId]
    );

    for (const member of memberResult.rows) {
      await client.query(
        `
        INSERT INTO message_status (message_id, user_id, status)
        VALUES ($1, $2, $3)
        ON CONFLICT (message_id, user_id)
        DO UPDATE SET status = EXCLUDED.status, updated_at = NOW()
        `,
        [
          message.message_id,
          member.user_id,
          member.user_id === req.user.user_id ? "SEEN" : "DELIVERED",
        ]
      );
    }

    await client.query("COMMIT");

    const responseMessage = {
      ...mapMessage({
        ...message,
        sender_name: req.user.username,
        status: "SEEN",
      }),
    };

    const io = getIO();
    if (io) {
      io.to(roomId).emit("message:new", responseMessage);

      for (const member of memberResult.rows) {
        if (member.user_id === req.user.user_id) continue;
        io.to(`user:${member.user_id}`).emit("notification:new", {
          title: `New message from ${req.user.username}`,
          body: text.trim().slice(0, 80),
          roomId,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return res.status(201).json({ message: responseMessage });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function editMessage(req, res) {
  const { messageId } = req.params;
  const { text } = req.body;

  if (!text || !String(text).trim()) {
    return res.status(400).json({ message: "text is required" });
  }

  const updateResult = await query(
    `
    UPDATE messages
    SET encrypted_content = $1,
        is_edited = TRUE,
        updated_at = NOW()
    WHERE message_id = $2
      AND sender_id = $3
      AND is_deleted = FALSE
    RETURNING message_id, room_id, sender_id, encrypted_content, message_type, is_edited, is_deleted, created_at
    `,
    [text.trim(), messageId, req.user.user_id]
  );

  if (updateResult.rowCount === 0) {
    return res.status(404).json({ message: "Message not found or cannot be edited" });
  }

  const message = updateResult.rows[0];
  const payload = mapMessage({
    ...message,
    sender_name: req.user.username,
    status: "SEEN",
  });

  const io = getIO();
  if (io) {
    io.to(message.room_id).emit("message:updated", payload);
  }

  return res.json({ message: payload });
}

async function deleteMessage(req, res) {
  const { messageId } = req.params;

  const updateResult = await query(
    `
    UPDATE messages
    SET encrypted_content = 'This message was deleted.',
        is_deleted = TRUE,
        updated_at = NOW()
    WHERE message_id = $1
      AND sender_id = $2
      AND is_deleted = FALSE
    RETURNING message_id, room_id, sender_id, encrypted_content, message_type, is_edited, is_deleted, created_at
    `,
    [messageId, req.user.user_id]
  );

  if (updateResult.rowCount === 0) {
    return res.status(404).json({ message: "Message not found or cannot be deleted" });
  }

  const message = updateResult.rows[0];
  const payload = mapMessage({
    ...message,
    sender_name: req.user.username,
    status: "SEEN",
  });

  const io = getIO();
  if (io) {
    io.to(message.room_id).emit("message:deleted", {
      chatId: message.room_id,
      messageId: message.message_id,
      message: payload,
    });
  }

  return res.json({ message: payload });
}

async function markMessageSeen(req, res) {
  const { messageId } = req.params;
  const userId = req.user.user_id;

  const messageResult = await query(
    `SELECT message_id, room_id FROM messages WHERE message_id = $1 LIMIT 1`,
    [messageId]
  );

  if (messageResult.rowCount === 0) {
    return res.status(404).json({ message: "Message not found" });
  }

  const message = messageResult.rows[0];

  const isMember = await assertMembership(message.room_id, userId);
  if (!isMember) {
    return res.status(403).json({ message: "Access denied" });
  }

  await query(
    `
    INSERT INTO message_status (message_id, user_id, status)
    VALUES ($1, $2, 'SEEN')
    ON CONFLICT (message_id, user_id)
    DO UPDATE SET status = 'SEEN', updated_at = NOW()
    `,
    [messageId, userId]
  );

  const io = getIO();
  if (io) {
    io.to(message.room_id).emit("message:status", {
      chatId: message.room_id,
      messageId,
      status: "seen",
      userId,
    });
  }

  return res.json({ success: true });
}

module.exports = {
  listMessagesByRoom,
  sendMessage,
  editMessage,
  deleteMessage,
  markMessageSeen,
};
