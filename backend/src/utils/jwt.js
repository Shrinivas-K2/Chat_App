const jwt = require("jsonwebtoken");
const { JWT_EXPIRES_IN, JWT_SECRET } = require("../config/env");

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function tokenExpiresAt(token) {
  const decoded = jwt.decode(token);
  if (!decoded?.exp) {
    return new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  }

  return new Date(decoded.exp * 1000);
}

module.exports = { signToken, verifyToken, tokenExpiresAt };
