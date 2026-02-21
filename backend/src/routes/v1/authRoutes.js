const express = require("express");
const { asyncHandler } = require("../../utils/asyncHandler");
const { authMiddleware } = require("../../middlewares/authMiddleware");
const { signup, login, me, logout } = require("../../controllers/auth/authController");

const authRoutes = express.Router();

authRoutes.post("/signup", asyncHandler(signup));
authRoutes.post("/login", asyncHandler(login));
authRoutes.get("/me", authMiddleware, asyncHandler(me));
authRoutes.post("/logout", authMiddleware, asyncHandler(logout));

module.exports = { authRoutes };
