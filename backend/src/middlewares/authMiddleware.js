const { query } = require("../config/db");
const { verifyToken } = require("../utils/jwt");

async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = verifyToken(token);

    const sessionResult = await query(
      `
      SELECT
        u.user_id,
        u.username,
        u.email,
        u.profile_picture,
        u.bio,
        u.is_online,
        u.last_seen,
        u.gender,
        u.date_of_birth
      FROM user_sessions s
      JOIN users u ON u.user_id = s.user_id
      WHERE s.jwt_token = $1
        AND s.is_valid = TRUE
        AND s.expires_at > NOW()
      LIMIT 1
      `,
      [token]
    );

    if (sessionResult.rowCount === 0) {
      return res.status(401).json({ message: "Session expired or invalid" });
    }

    req.user = sessionResult.rows[0];
    req.token = token;
    req.jwt = decoded;

    return next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

module.exports = { authMiddleware };
