const path = require("path");
const dotenv = require("dotenv");

const backendEnvPath = path.resolve(__dirname, "../../.env");
const cwdEnvPath = path.resolve(process.cwd(), ".env");

dotenv.config({ path: backendEnvPath });
dotenv.config({ path: cwdEnvPath, override: true });

function asNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asString(value, fallback = "") {
  if (value === undefined || value === null) {
    return fallback;
  }
  return String(value);
}

const rawHost = process.env.DB_HOST || "localhost";
const rawClientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const primaryClientOrigin = rawClientOrigin
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean)[0] || "http://localhost:5173";

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: asNumber(process.env.PORT, 5000),
  CLIENT_ORIGIN: rawClientOrigin,
  APP_BASE_URL: asString(process.env.APP_BASE_URL, primaryClientOrigin),

  DB_HOST: rawHost === "*" ? "localhost" : rawHost,
  DB_PORT: asNumber(process.env.DB_PORT, 5432),
  DB_NAME: asString(process.env.DB_NAME, "chat_app"),
  DB_USER: asString(process.env.DB_USER, "postgres"),
  DB_PASSWORD: asString(process.env.DB_PASSWORD, ""),
  DB_SSL: (process.env.DB_SSL || "false").toLowerCase() === "true",

  JWT_SECRET: process.env.JWT_SECRET || "dev-secret",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  GOOGLE_CLIENT_ID: asString(process.env.GOOGLE_CLIENT_ID, ""),
  EMAIL_VERIFICATION_TTL_MINUTES: asNumber(process.env.EMAIL_VERIFICATION_TTL_MINUTES, 60 * 24),
  RESEND_API_KEY: asString(process.env.RESEND_API_KEY, ""),
  EMAIL_FROM: asString(process.env.EMAIL_FROM, ""),
};

module.exports = env;
