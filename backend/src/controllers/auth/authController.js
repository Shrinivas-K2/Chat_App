const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { pool, query } = require("../../config/db");
const { signToken, tokenExpiresAt } = require("../../utils/jwt");
const { GOOGLE_CLIENT_ID } = require("../../config/env");

const GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo?id_token=";
const GOOGLE_ISSUERS = new Set(["accounts.google.com", "https://accounts.google.com"]);

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

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizeUsername(username) {
  return String(username || "").trim();
}

function buildGoogleUsernameBase(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);

  if (!normalized) {
    return "user";
  }

  if (normalized.length >= 3) {
    return normalized;
  }

  return normalized.padEnd(3, "0");
}

async function createSession(client, user) {
  const token = signToken({ sub: user.user_id, email: user.email });
  const expiresAt = tokenExpiresAt(token);

  await client.query(
    `
    INSERT INTO user_sessions (user_id, jwt_token, expires_at, is_valid)
    VALUES ($1, $2, $3, TRUE)
    `,
    [user.user_id, token, expiresAt]
  );

  return { token, expiresAt };
}

async function ensureUniqueUsername(client, baseUsername) {
  const base = baseUsername.slice(0, 40) || "user";

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const suffix = attempt === 0 ? "" : `_${crypto.randomInt(1000, 10000)}`;
    const candidate = `${base}${suffix}`.slice(0, 50);
    const existing = await client.query(`SELECT user_id FROM users WHERE username = $1 LIMIT 1`, [candidate]);

    if (existing.rowCount === 0) {
      return candidate;
    }
  }

  return `user_${crypto.randomInt(100000, 1000000)}`;
}

async function verifyGoogleIdToken(idToken) {
  if (!GOOGLE_CLIENT_ID) {
    const error = new Error("Google sign-in is not configured on the server");
    error.status = 500;
    throw error;
  }

  if (typeof fetch !== "function" || typeof AbortController !== "function") {
    const error = new Error("Google sign-in requires a newer Node.js runtime");
    error.status = 500;
    throw error;
  }

  const allowedAudiences = GOOGLE_CLIENT_ID.split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  let response;

  try {
    response = await fetch(`${GOOGLE_TOKEN_INFO_URL}${encodeURIComponent(idToken)}`, {
      signal: controller.signal,
    });
  } catch (err) {
    const error = new Error("Unable to verify Google token right now");
    error.status = err.name === "AbortError" ? 504 : 502;
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const error = new Error("Invalid Google token");
    error.status = 401;
    throw error;
  }

  const payload = await response.json();
  const email = normalizeEmail(payload.email);
  const emailVerified = String(payload.email_verified || "").toLowerCase() === "true";
  const issuer = String(payload.iss || "");
  const audience = String(payload.aud || "");
  const expiresAtSeconds = Number(payload.exp || 0);

  if (!email) {
    const error = new Error("Google account did not include an email");
    error.status = 400;
    throw error;
  }

  if (!emailVerified) {
    const error = new Error("Google account email is not verified");
    error.status = 403;
    throw error;
  }

  if (!GOOGLE_ISSUERS.has(issuer)) {
    const error = new Error("Invalid Google token issuer");
    error.status = 401;
    throw error;
  }

  if (!Number.isFinite(expiresAtSeconds) || expiresAtSeconds * 1000 <= Date.now()) {
    const error = new Error("Google token has expired");
    error.status = 401;
    throw error;
  }

  if (allowedAudiences.length > 0 && !allowedAudiences.includes(audience)) {
    const error = new Error("Google token audience mismatch");
    error.status = 401;
    throw error;
  }

  return {
    email,
    name: String(payload.name || ""),
    profilePicture: String(payload.picture || ""),
  };
}

async function signup(req, res) {
  const { username, email, password } = req.body;
  const normalizedUsername = normalizeUsername(username);
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedUsername || !normalizedEmail || !validatePassword(password)) {
    return res.status(400).json({ message: "username, email, and password (min 6 chars) are required" });
  }

  const existing = await query(
    `SELECT user_id FROM users WHERE email = $1 OR username = $2 LIMIT 1`,
    [normalizedEmail, normalizedUsername]
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
      [normalizedUsername, normalizedEmail, passwordHash]
    );

    const user = userResult.rows[0];
    const { token } = await createSession(client, user);

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
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    return res.status(400).json({ message: "email and password are required" });
  }

  const userResult = await query(
    `
    SELECT user_id, username, email, password_hash, profile_picture, bio, is_online, last_seen, gender, date_of_birth
    FROM users
    WHERE email = $1
    LIMIT 1
    `,
    [normalizedEmail]
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

async function googleAuth(req, res) {
  const idToken = String(req.body.idToken || "").trim();

  if (!idToken) {
    return res.status(400).json({ message: "Google idToken is required" });
  }

  const googleProfile = await verifyGoogleIdToken(idToken);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existingResult = await client.query(
      `
      SELECT user_id, username, email, profile_picture, bio, is_online, last_seen, gender, date_of_birth
      FROM users
      WHERE email = $1
      LIMIT 1
      `,
      [googleProfile.email]
    );

    let user;

    if (existingResult.rowCount > 0) {
      const existingUser = existingResult.rows[0];
      const updated = await client.query(
        `
        UPDATE users
        SET profile_picture = COALESCE(profile_picture, $2),
            is_online = TRUE,
            updated_at = NOW()
        WHERE user_id = $1
        RETURNING user_id, username, email, profile_picture, bio, is_online, last_seen, gender, date_of_birth
        `,
        [existingUser.user_id, googleProfile.profilePicture || null]
      );

      user = updated.rows[0];
    } else {
      const baseUsername = buildGoogleUsernameBase(
        googleProfile.name || googleProfile.email.split("@")[0] || "user"
      );
      const username = await ensureUniqueUsername(client, baseUsername);
      const passwordHash = await bcrypt.hash(crypto.randomUUID(), 10);

      const created = await client.query(
        `
        INSERT INTO users (username, email, password_hash, profile_picture, is_online)
        VALUES ($1, $2, $3, $4, TRUE)
        RETURNING user_id, username, email, profile_picture, bio, is_online, last_seen, gender, date_of_birth
        `,
        [username, googleProfile.email, passwordHash, googleProfile.profilePicture || null]
      );

      user = created.rows[0];
    }

    const { token } = await createSession(client, user);

    await client.query("COMMIT");

    return res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
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

module.exports = { signup, login, googleAuth, me, logout };
