const express = require("express");
const { asyncHandler } = require("../../utils/asyncHandler");
const { authMiddleware } = require("../../middlewares/authMiddleware");
const {
  signup,
  login,
  googleAuth,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  me,
  logout,
} = require("../../controllers/auth/authController");

const authRoutes = express.Router();

authRoutes.post("/signup", asyncHandler(signup));
authRoutes.post("/login", asyncHandler(login));
authRoutes.post("/google", asyncHandler(googleAuth));
authRoutes.post("/verify-email", asyncHandler(verifyEmail));
authRoutes.post("/resend-verification", asyncHandler(resendVerification));
authRoutes.post("/forgot-password", asyncHandler(forgotPassword));
authRoutes.post("/reset-password", asyncHandler(resetPassword));
authRoutes.get("/me", authMiddleware, asyncHandler(me));
authRoutes.post("/logout", authMiddleware, asyncHandler(logout));

module.exports = { authRoutes };
