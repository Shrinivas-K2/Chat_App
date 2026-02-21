const bcrypt = require("bcryptjs");
const { pool, query } = require("../../config/db");
const { signToken, tokenExpiresAt } = require("../../utils/jwt");

function sanitizeUser(user) {
  return {
    id: user.user_id,
    name: user.username,
    email: user.email,
    avatar: (user.username || "U").slice(0, 2).toUpperCase(),
    profilePicture: user.profile_picture,
    bio: user.bio,
    isOnline: Boolean(user.is_online),
    lastSeen: user.last_seen,
    gender: user.gender,
    dateOfBirth: user.date_of_birth,
  };
}

function validatePassword(password) {
  return typeof password === "string" && password.length >= 6;
}

async function signup(req, res) {
  const { username, email, password } = req.body;

  if (!username || !email || !validatePassword(password)) {
    return res.status(400).json({ message: "username, email, and password (min 6 chars) are required" });
  }

  const existing = await query(
    `SELECT user_id FROM users WHERE email = $1 OR username = $2 LIMIT 1`,
    [email.trim().toLowerCase(), username.trim()]
  );

  if (existing.rowCount > 0) {
    return res.status(409).json({ message: "Email or username already exists" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const passwordHash = await bcrypt.hash(password, 10);

    const userResult = await client.query(
      `
      INSERT INTO users (username, email, password_hash, is_online)
      VALUES ($1, $2, $3, TRUE)
      RETURNING user_id, username, email, profile_picture, bio, is_online, last_seen, gender, date_of_birth
      `,
      [username.trim(), email.trim().toLowerCase(), passwordHash]
    );

    const user = userResult.rows[0];
    const token = signToken({ sub: user.user_id, email: user.email });
    const expiresAt = tokenExpiresAt(token);

    await client.query(
      `
      INSERT INTO user_sessions (user_id, jwt_token, expires_at, is_valid)
      VALUES ($1, $2, $3, TRUE)
      `,
      [user.user_id, token, expiresAt]
    );

    await client.query("COMMIT");

    return res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required" });
  }

  const userResult = await query(
    `
    SELECT user_id, username, email, password_hash, profile_picture, bio, is_online, last_seen, gender, date_of_birth
    FROM users
    WHERE email = $1
    LIMIT 1
    `,
    [email.trim().toLowerCase()]
  );

  if (userResult.rowCount === 0) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const user = userResult.rows[0];
  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signToken({ sub: user.user_id, email: user.email });
  const expiresAt = tokenExpiresAt(token);

  await query(
    `
    INSERT INTO user_sessions (user_id, jwt_token, expires_at, is_valid)
    VALUES ($1, $2, $3, TRUE)
    `,
    [user.user_id, token, expiresAt]
  );

  await query(
    `
    UPDATE users
    SET is_online = TRUE, updated_at = NOW()
    WHERE user_id = $1
    `,
    [user.user_id]
  );

  return res.json({ token, user: sanitizeUser(user) });
}

async function me(req, res) {
  return res.json({ user: sanitizeUser(req.user) });
}

async function logout(req, res) {
  await query(
    `
    UPDATE user_sessions
    SET is_valid = FALSE
    WHERE jwt_token = $1
    `,
    [req.token]
  );

  await query(
    `
    UPDATE users
    SET is_online = FALSE, last_seen = NOW(), updated_at = NOW()
    WHERE user_id = $1
    `,
    [req.user.user_id]
  );

  return res.json({ success: true });
}

module.exports = { signup, login, me, logout };
