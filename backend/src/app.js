const express = require("express");
const cors = require("cors");
const { apiRouter } = require("./routes");
const { CLIENT_ORIGIN } = require("./config/env");
const { errorHandler, notFoundHandler } = require("./middlewares/errorHandler");

const app = express();

const allowedOrigins = CLIENT_ORIGIN.split(",").map((origin) => origin.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "chat-app-backend" });
});

app.use("/api", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = { app };
