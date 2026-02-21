const http = require("http");
const { app } = require("./app");
const { PORT } = require("./config/env");
const { connectDB, pool } = require("./config/db");
const { initSocketServer } = require("./services/socket/socketServer");

async function start() {
  await connectDB();

  const server = http.createServer(app);
  const io = initSocketServer(server);
  app.set("io", io);

  server.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start().catch((error) => {
  console.error("Failed to start backend", error);
  process.exit(1);
});
