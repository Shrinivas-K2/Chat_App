const express = require("express");
const { asyncHandler } = require("../../utils/asyncHandler");
const { authMiddleware } = require("../../middlewares/authMiddleware");
const {
  searchUsers,
  listConnectedUsers,
  setGender,
} = require("../../controllers/user/userController");

const userRoutes = express.Router();

userRoutes.get("/search", authMiddleware, asyncHandler(searchUsers));
userRoutes.get("/connected", authMiddleware, asyncHandler(listConnectedUsers));
userRoutes.patch("/gender", authMiddleware, asyncHandler(setGender));

module.exports = { userRoutes };
