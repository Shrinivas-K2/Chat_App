const express = require("express");
const { authRoutes } = require("./authRoutes");
const { userRoutes } = require("./userRoutes");
const { roomRoutes } = require("./roomRoutes");
const { messageRoutes } = require("./messageRoutes");

const v1Router = express.Router();

v1Router.use("/auth", authRoutes);
v1Router.use("/users", userRoutes);
v1Router.use("/rooms", roomRoutes);
v1Router.use("/messages", messageRoutes);

module.exports = { v1Router };
