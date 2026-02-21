const express = require("express");
const { asyncHandler } = require("../../utils/asyncHandler");
const { authMiddleware } = require("../../middlewares/authMiddleware");
const { searchUsers, setGender } = require("../../controllers/user/userController");

const userRoutes = express.Router();

userRoutes.get("/search", authMiddleware, asyncHandler(searchUsers));
userRoutes.patch("/gender", authMiddleware, asyncHandler(setGender));

module.exports = { userRoutes };
