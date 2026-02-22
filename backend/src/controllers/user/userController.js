const { query } = require("../../config/db");

const ALLOWED_GENDERS = new Set(["MALE", "FEMALE", "OTHER"]);

function mapUser(row) {
  return {
    id: row.user_id,
    name: row.username,
    email: row.email,
    avatar: (row.username || "U").slice(0, 2).toUpperCase(),
    profilePicture: row.profile_picture,
    bio: row.bio,
    isOnline: Boolean(row.is_online),
    lastSeen: row.last_seen,
    gender: row.gender,
    dateOfBirth: row.date_of_birth,
  };
}

async function searchUsers(req, res) {
  const text = (req.query.q || "").trim();

  if (!text) {
    return res.json({ users: [] });
  }

  const result = await query(
    `
    SELECT user_id, username, email, profile_picture, is_online
    FROM users
    WHERE (username ILIKE $1 OR email ILIKE $1)
      AND user_id <> $2
    ORDER BY username ASC
    LIMIT 20
    `,
    [`%${text}%`, req.user.user_id]
  );

  const users = result.rows.map((row) => ({
    id: row.user_id,
    name: row.username,
    email: row.email,
    avatar: (row.username || "U").slice(0, 2).toUpperCase(),
    profilePicture: row.profile_picture,
    isOnline: Boolean(row.is_online),
  }));

  return res.json({ users });
}

async function listConnectedUsers(req, res) {
  const result = await query(
    `
    SELECT user_id, username, email, profile_picture, is_online, date_of_birth
    FROM users
    WHERE user_id <> $1
    ORDER BY is_online DESC, username ASC
    `,
    [req.user.user_id]
  );

  const users = result.rows.map((row) => ({
    id: row.user_id,
    name: row.username,
      email: row.email,
      avatar: (row.username || "U").slice(0, 2).toUpperCase(),
      profilePicture: row.profile_picture,
      isOnline: Boolean(row.is_online),
      dateOfBirth: row.date_of_birth,
    }));

  return res.json({ users });
}

async function setGender(req, res) {
  const gender = String(req.body.gender || "").toUpperCase();
  const dateOfBirth = req.body.dateOfBirth || null;

  if (!ALLOWED_GENDERS.has(gender)) {
    return res.status(400).json({ message: "gender must be MALE, FEMALE, or OTHER" });
  }

  const result = await query(
    `
    UPDATE users
    SET gender = $1,
        date_of_birth = COALESCE($2::date, date_of_birth),
        updated_at = NOW()
    WHERE user_id = $3
      AND gender IS NULL
    RETURNING user_id, username, email, profile_picture, bio, is_online, last_seen, gender, date_of_birth
    `,
    [gender, dateOfBirth, req.user.user_id]
  );

  if (result.rowCount === 0) {
    const existing = await query(
      `
      SELECT gender
      FROM users
      WHERE user_id = $1
      LIMIT 1
      `,
      [req.user.user_id]
    );

    if (existing.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    if (existing.rows[0].gender) {
      return res.status(409).json({ message: "Gender already set and cannot be edited" });
    }

    return res.status(500).json({ message: "Unable to update gender" });
  }

  return res.json({ user: mapUser(result.rows[0]) });
}

module.exports = { searchUsers, listConnectedUsers, setGender };
