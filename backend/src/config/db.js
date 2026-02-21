const { Pool } = require("pg");
const {
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_SSL,
} = require("./env");

if (!DB_PASSWORD) {
  throw new Error("DB_PASSWORD is missing. Set DB_PASSWORD in backend/.env before starting the server.");
}

const pool = new Pool({
  host: DB_HOST,
  port: DB_PORT,
  database: DB_NAME,
  user: DB_USER,
  password: String(DB_PASSWORD),
  ssl: DB_SSL ? { rejectUnauthorized: false } : false,
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error", err);
});

async function connectDB() {
  await pool.query("SELECT 1");
  console.log("Connected to PostgreSQL");
}

async function query(text, params = []) {
  return pool.query(text, params);
}

module.exports = { pool, connectDB, query };
