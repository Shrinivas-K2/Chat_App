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

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: asNumber(process.env.PORT, 5000),
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:5173",

  DB_HOST: rawHost === "*" ? "localhost" : rawHost,
  DB_PORT: asNumber(process.env.DB_PORT, 5432),
  DB_NAME: asString(process.env.DB_NAME, "chat_app"),
  DB_USER: asString(process.env.DB_USER, "postgres"),
  DB_PASSWORD: asString(process.env.DB_PASSWORD, ""),
  DB_SSL: (process.env.DB_SSL || "false").toLowerCase() === "true",

  JWT_SECRET: process.env.JWT_SECRET || "dev-secret",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
};

module.exports = env;
