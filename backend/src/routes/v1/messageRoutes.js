const express = require("express");
const { asyncHandler } = require("../../utils/asyncHandler");
const { authMiddleware } = require("../../middlewares/authMiddleware");
const {
  listMessagesByRoom,
  sendMessage,
  editMessage,
  deleteMessage,
  markMessageSeen,
} = require("../../controllers/message/messageController");

const messageRoutes = express.Router();

messageRoutes.get("/room/:roomId", authMiddleware, asyncHandler(listMessagesByRoom));
messageRoutes.post("/", authMiddleware, asyncHandler(sendMessage));
messageRoutes.patch("/:messageId", authMiddleware, asyncHandler(editMessage));
messageRoutes.delete("/:messageId", authMiddleware, asyncHandler(deleteMessage));
messageRoutes.patch("/:messageId/seen", authMiddleware, asyncHandler(markMessageSeen));

module.exports = { messageRoutes };
