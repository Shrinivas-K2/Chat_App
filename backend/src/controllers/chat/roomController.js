const { pool, query } = require("../../config/db");
const { getIO } = require("../../services/socket/socketState");

function toChatSummary(row, currentUserId) {
  const members = row.members || [];
  const isGroup = row.room_type === "PUBLIC";

  let title = row.room_name || "Group";
  let avatar = "GR";
  let online = false;

  if (!isGroup) {
    const other = members.find((member) => member.user_id !== currentUserId) || members[0];
    title = other?.username || "Direct Chat";
    avatar = (title || "D").slice(0, 2).toUpperCase();
    online = Boolean(other?.is_online);
  } else {
    avatar =
      (title || "GR")
        .split(" ")
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase() || "")
        .join("") || "GR";
  }

  return {
    id: row.room_id,
    title,
    type: isGroup ? "group" : "direct",
    avatar,
    online,
    lastMessageAt: row.last_message_at || row.created_at,
    membersCount: members.length,
  };
}

function notifyUser(userId, payload) {
  const io = getIO();
  if (!io) return;
  io.to(`user:${userId}`).emit("notification:new", payload);
}

async function getRoomSummaryForUser(roomId, userId, runner = query) {
  const result = await runner(
    `
    SELECT
      r.room_id,
      r.room_name,
      r.room_type,
      r.created_at,
      MAX(m.created_at) AS last_message_at,
      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'user_id', u.user_id,
              'username', u.username,
              'profile_picture', u.profile_picture,
              'is_online', u.is_online
            )
          )
          FROM room_members rm2
          JOIN users u ON u.user_id = rm2.user_id
          WHERE rm2.room_id = r.room_id
            AND rm2.status = 'APPROVED'
        ),
        '[]'::json
      ) AS members
    FROM rooms r
    JOIN room_members rm
      ON rm.room_id = r.room_id
     AND rm.user_id = $2
     AND rm.status = 'APPROVED'
    LEFT JOIN messages m ON m.room_id = r.room_id
    WHERE r.room_id = $1
      AND r.is_active = TRUE
    GROUP BY r.room_id
    LIMIT 1
    `,
    [roomId, userId]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return toChatSummary(result.rows[0], userId);
}

async function listRooms(req, res) {
  const result = await query(
    `
    SELECT
      r.room_id,
      r.room_name,
      r.room_type,
      r.created_at,
      MAX(m.created_at) AS last_message_at,
      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'user_id', u.user_id,
              'username', u.username,
              'profile_picture', u.profile_picture,
              'is_online', u.is_online
            )
          )
          FROM room_members rm2
          JOIN users u ON u.user_id = rm2.user_id
          WHERE rm2.room_id = r.room_id
            AND rm2.status = 'APPROVED'
        ),
        '[]'::json
      ) AS members
    FROM rooms r
    JOIN room_members rm
      ON rm.room_id = r.room_id
     AND rm.user_id = $1
     AND rm.status = 'APPROVED'
    LEFT JOIN messages m
      ON m.room_id = r.room_id
    WHERE r.is_active = TRUE
    GROUP BY r.room_id
    ORDER BY COALESCE(MAX(m.created_at), r.created_at) DESC
    `,
    [req.user.user_id]
  );

  const rooms = result.rows.map((row) => toChatSummary(row, req.user.user_id));

  return res.json({ rooms });
}

async function createPrivateRoom(req, res) {
  const { targetUserId } = req.body;

  if (!targetUserId) {
    return res.status(400).json({ message: "targetUserId is required" });
  }

  if (targetUserId === req.user.user_id) {
    return res.status(400).json({ message: "Cannot create direct room with yourself" });
  }

  const targetUser = await query(
    `
    SELECT user_id, username
    FROM users
    WHERE user_id = $1
    LIMIT 1
    `,
    [targetUserId]
  );

  if (targetUser.rowCount === 0) {
    return res.status(404).json({ message: "Target user not found" });
  }

  const existing = await query(
    `
    SELECT
      r.room_id,
      MAX(CASE WHEN rm.user_id = $1 THEN rm.status END) AS requester_status,
      MAX(CASE WHEN rm.user_id = $2 THEN rm.status END) AS target_status
    FROM rooms r
    JOIN room_members rm ON rm.room_id = r.room_id
    WHERE r.room_type = 'PRIVATE'
      AND r.is_active = TRUE
      AND rm.user_id IN ($1, $2)
    GROUP BY r.room_id
    HAVING COUNT(DISTINCT rm.user_id) = 2
    LIMIT 1
    `,
    [req.user.user_id, targetUserId]
  );

  if (existing.rowCount > 0) {
    const existingRoom = existing.rows[0];

    if (
      existingRoom.requester_status === "APPROVED" &&
      existingRoom.target_status === "APPROVED"
    ) {
      const room = await getRoomSummaryForUser(existingRoom.room_id, req.user.user_id);
      return res.json({ room, requestPending: false, status: "APPROVED" });
    }

    if (existingRoom.target_status === "REJECTED") {
      await query(
        `
        UPDATE room_members
        SET status = 'PENDING', joined_at = NOW()
        WHERE room_id = $1
          AND user_id = $2
        `,
        [existingRoom.room_id, targetUserId]
      );
    }

    notifyUser(targetUserId, {
      title: "Private chat request",
      body: `${req.user.username} wants to chat with you`,
      roomId: existingRoom.room_id,
      type: "private_request",
      timestamp: new Date().toISOString(),
    });

    return res.status(202).json({
      requestPending: true,
      status: "PENDING",
      roomId: existingRoom.room_id,
      message: "Chat request sent",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const roomResult = await client.query(
      `
      INSERT INTO rooms (room_type, created_by)
      VALUES ('PRIVATE', $1)
      RETURNING room_id
      `,
      [req.user.user_id]
    );

    const roomId = roomResult.rows[0].room_id;

    await client.query(
      `
      INSERT INTO room_members (room_id, user_id, role, status)
      VALUES
        ($1, $2, 'ADMIN', 'APPROVED'),
        ($1, $3, 'MEMBER', 'PENDING')
      `,
      [roomId, req.user.user_id, targetUserId]
    );

    await client.query("COMMIT");

    notifyUser(targetUserId, {
      title: "Private chat request",
      body: `${req.user.username} wants to chat with you`,
      roomId,
      type: "private_request",
      timestamp: new Date().toISOString(),
    });

    return res.status(202).json({
      requestPending: true,
      status: "PENDING",
      roomId,
      message: "Chat request sent",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function listPrivateRequests(req, res) {
  const result = await query(
    `
    SELECT
      r.room_id,
      r.created_at,
      u.user_id AS from_user_id,
      u.username AS from_username,
      u.email AS from_email
    FROM room_members me
    JOIN rooms r
      ON r.room_id = me.room_id
     AND r.room_type = 'PRIVATE'
     AND r.is_active = TRUE
    JOIN room_members requester
      ON requester.room_id = r.room_id
     AND requester.user_id <> me.user_id
     AND requester.status = 'APPROVED'
    JOIN users u ON u.user_id = requester.user_id
    WHERE me.user_id = $1
      AND me.status = 'PENDING'
    ORDER BY me.joined_at DESC
    `,
    [req.user.user_id]
  );

  const requests = result.rows.map((row) => ({
    roomId: row.room_id,
    createdAt: row.created_at,
    fromUser: {
      id: row.from_user_id,
      name: row.from_username,
      email: row.from_email,
      avatar: (row.from_username || "U").slice(0, 2).toUpperCase(),
    },
  }));

  return res.json({ requests });
}

async function respondPrivateRequest(req, res) {
  const { roomId } = req.params;
  const action = String(req.body.action || "").toUpperCase();

  if (!["APPROVE", "REJECT"].includes(action)) {
    return res.status(400).json({ message: "action must be APPROVE or REJECT" });
  }

  const nextStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

  const updateResult = await query(
    `
    UPDATE room_members me
    SET status = $1
    FROM rooms r
    WHERE me.room_id = $2
      AND me.user_id = $3
      AND me.status = 'PENDING'
      AND r.room_id = me.room_id
      AND r.room_type = 'PRIVATE'
      AND r.is_active = TRUE
    RETURNING me.room_id
    `,
    [nextStatus, roomId, req.user.user_id]
  );

  if (updateResult.rowCount === 0) {
    return res.status(404).json({ message: "Pending chat request not found" });
  }

  const requesterResult = await query(
    `
    SELECT rm.user_id, u.username
    FROM room_members rm
    JOIN users u ON u.user_id = rm.user_id
    WHERE rm.room_id = $1
      AND rm.user_id <> $2
    ORDER BY CASE WHEN rm.status = 'APPROVED' THEN 0 ELSE 1 END
    LIMIT 1
    `,
    [roomId, req.user.user_id]
  );

  const requester = requesterResult.rows[0] || null;
  let room = null;

  if (nextStatus === "APPROVED") {
    room = await getRoomSummaryForUser(roomId, req.user.user_id);

    if (requester?.user_id) {
      const requesterRoom = await getRoomSummaryForUser(roomId, requester.user_id);
      const io = getIO();
      if (io && requesterRoom) {
        io.to(`user:${requester.user_id}`).emit("room:available", {
          room: requesterRoom,
        });
      }
    }
  }

  if (requester?.user_id) {
    notifyUser(requester.user_id, {
      title: "Private request update",
      body:
        nextStatus === "APPROVED"
          ? `${req.user.username} accepted your request`
          : `${req.user.username} rejected your request`,
      roomId,
      type: "private_request_response",
      timestamp: new Date().toISOString(),
    });
  }

  return res.json({
    success: true,
    status: nextStatus,
    room,
  });
}

async function createGroupRoom(req, res) {
  const { roomName, memberIds = [] } = req.body;

  if (!roomName || typeof roomName !== "string") {
    return res.status(400).json({ message: "roomName is required" });
  }
  if (!roomName.trim()) {
    return res.status(400).json({ message: "roomName cannot be empty" });
  }

  const uniqueMembers = Array.from(new Set(memberIds)).filter(
    (id) => id && id !== req.user.user_id
  );

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const roomResult = await client.query(
      `
      INSERT INTO rooms (room_name, room_type, created_by)
      VALUES ($1, 'PUBLIC', $2)
      RETURNING room_id
      `,
      [roomName.trim(), req.user.user_id]
    );

    const roomId = roomResult.rows[0].room_id;

    await client.query(
      `
      INSERT INTO room_members (room_id, user_id, role, status)
      VALUES ($1, $2, 'ADMIN', 'APPROVED')
      ON CONFLICT DO NOTHING
      `,
      [roomId, req.user.user_id]
    );

    for (const memberId of uniqueMembers) {
      await client.query(
        `
        INSERT INTO room_members (room_id, user_id, role, status)
        SELECT $1, $2, 'MEMBER', 'APPROVED'
        WHERE EXISTS (SELECT 1 FROM users WHERE user_id = $2)
        ON CONFLICT DO NOTHING
        `,
        [roomId, memberId]
      );
    }

    await client.query("COMMIT");

    const room = await getRoomSummaryForUser(roomId, req.user.user_id);
    return res.status(201).json({ room });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function requestJoinGroup(req, res) {
  const { roomId } = req.params;

  const groupResult = await query(
    `
    SELECT room_id, room_name
    FROM rooms
    WHERE room_id = $1
      AND room_type = 'PUBLIC'
      AND is_active = TRUE
    LIMIT 1
    `,
    [roomId]
  );

  if (groupResult.rowCount === 0) {
    return res.status(404).json({ message: "Group not found" });
  }

  const existingMember = await query(
    `
    SELECT status
    FROM room_members
    WHERE room_id = $1
      AND user_id = $2
    LIMIT 1
    `,
    [roomId, req.user.user_id]
  );

  if (existingMember.rowCount > 0) {
    const status = existingMember.rows[0].status;
    if (status === "APPROVED") {
      return res.status(409).json({ message: "You are already a group member" });
    }

    if (status === "PENDING") {
      return res.status(202).json({ requestPending: true, status: "PENDING" });
    }

    await query(
      `
      UPDATE room_members
      SET status = 'PENDING', joined_at = NOW()
      WHERE room_id = $1
        AND user_id = $2
      `,
      [roomId, req.user.user_id]
    );
  } else {
    await query(
      `
      INSERT INTO room_members (room_id, user_id, role, status)
      VALUES ($1, $2, 'MEMBER', 'PENDING')
      `,
      [roomId, req.user.user_id]
    );
  }

  const adminResult = await query(
    `
    SELECT user_id
    FROM room_members
    WHERE room_id = $1
      AND role = 'ADMIN'
      AND status = 'APPROVED'
      AND user_id <> $2
    `,
    [roomId, req.user.user_id]
  );

  adminResult.rows.forEach((admin) => {
    notifyUser(admin.user_id, {
      title: "Group join request",
      body: `${req.user.username} requested to join ${groupResult.rows[0].room_name}`,
      roomId,
      type: "group_join_request",
      timestamp: new Date().toISOString(),
    });
  });

  return res.status(202).json({ requestPending: true, status: "PENDING" });
}

async function listGroupJoinRequests(req, res) {
  const result = await query(
    `
    SELECT
      r.room_id,
      r.room_name,
      rm.user_id,
      u.username,
      u.email,
      rm.joined_at
    FROM rooms r
    JOIN room_members admin
      ON admin.room_id = r.room_id
     AND admin.user_id = $1
     AND admin.role = 'ADMIN'
     AND admin.status = 'APPROVED'
    JOIN room_members rm
      ON rm.room_id = r.room_id
     AND rm.status = 'PENDING'
    JOIN users u ON u.user_id = rm.user_id
    WHERE r.room_type = 'PUBLIC'
      AND r.is_active = TRUE
    ORDER BY rm.joined_at DESC
    `,
    [req.user.user_id]
  );

  const requests = result.rows.map((row) => ({
    roomId: row.room_id,
    roomName: row.room_name,
    user: {
      id: row.user_id,
      name: row.username,
      email: row.email,
      avatar: (row.username || "U").slice(0, 2).toUpperCase(),
    },
    requestedAt: row.joined_at,
  }));

  return res.json({ requests });
}

async function respondGroupJoinRequest(req, res) {
  const { roomId, userId } = req.params;
  const action = String(req.body.action || "").toUpperCase();

  if (!["APPROVE", "REJECT"].includes(action)) {
    return res.status(400).json({ message: "action must be APPROVE or REJECT" });
  }

  const isAdmin = await query(
    `
    SELECT 1
    FROM room_members rm
    JOIN rooms r ON r.room_id = rm.room_id
    WHERE rm.room_id = $1
      AND rm.user_id = $2
      AND rm.role = 'ADMIN'
      AND rm.status = 'APPROVED'
      AND r.room_type = 'PUBLIC'
      AND r.is_active = TRUE
    LIMIT 1
    `,
    [roomId, req.user.user_id]
  );

  if (isAdmin.rowCount === 0) {
    return res.status(403).json({ message: "Only group admins can review requests" });
  }

  const nextStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

  const updateResult = await query(
    `
    UPDATE room_members
    SET status = $1
    WHERE room_id = $2
      AND user_id = $3
      AND status = 'PENDING'
    RETURNING room_id
    `,
    [nextStatus, roomId, userId]
  );

  if (updateResult.rowCount === 0) {
    return res.status(404).json({ message: "Pending join request not found" });
  }

  let room = null;
  if (nextStatus === "APPROVED") {
    room = await getRoomSummaryForUser(roomId, userId);
    const io = getIO();
    if (io && room) {
      io.to(`user:${userId}`).emit("room:available", { room });
    }
  }

  notifyUser(userId, {
    title: "Group request update",
    body:
      nextStatus === "APPROVED"
        ? `Your request to join was approved`
        : `Your request to join was rejected`,
    roomId,
    type: "group_join_response",
    timestamp: new Date().toISOString(),
  });

  return res.json({ success: true, status: nextStatus, room });
}

async function deleteGroupRoom(req, res) {
  const { roomId } = req.params;

  const result = await query(
    `
    UPDATE rooms
    SET is_active = FALSE
    WHERE room_id = $1
      AND room_type = 'PUBLIC'
      AND created_by = $2
      AND is_active = TRUE
    RETURNING room_id
    `,
    [roomId, req.user.user_id]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ message: "Group not found or permission denied" });
  }

  return res.json({ success: true, roomId });
}

module.exports = {
  listRooms,
  createPrivateRoom,
  listPrivateRequests,
  respondPrivateRequest,
  createGroupRoom,
  requestJoinGroup,
  listGroupJoinRequests,
  respondGroupJoinRequest,
  deleteGroupRoom,
  getRoomSummaryForUser,
};
