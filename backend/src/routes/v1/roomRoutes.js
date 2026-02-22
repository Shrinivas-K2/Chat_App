const express = require("express");
const { asyncHandler } = require("../../utils/asyncHandler");
const { authMiddleware } = require("../../middlewares/authMiddleware");
const {
  listRooms,
  listPublicGroups,
  createPrivateRoom,
  listPrivateRequests,
  respondPrivateRequest,
  createGroupRoom,
  requestJoinGroup,
  listGroupJoinRequests,
  respondGroupJoinRequest,
  deleteGroupRoom,
  hideRoomHistory,
} = require("../../controllers/chat/roomController");

const roomRoutes = express.Router();

roomRoutes.get("/", authMiddleware, asyncHandler(listRooms));
roomRoutes.get("/groups/public", authMiddleware, asyncHandler(listPublicGroups));
roomRoutes.post("/private", authMiddleware, asyncHandler(createPrivateRoom));
roomRoutes.get("/private/requests", authMiddleware, asyncHandler(listPrivateRequests));
roomRoutes.patch("/private/requests/:roomId", authMiddleware, asyncHandler(respondPrivateRequest));
roomRoutes.post("/group", authMiddleware, asyncHandler(createGroupRoom));
roomRoutes.patch("/:roomId/hide", authMiddleware, asyncHandler(hideRoomHistory));
roomRoutes.post("/:roomId/join-request", authMiddleware, asyncHandler(requestJoinGroup));
roomRoutes.get("/group/requests", authMiddleware, asyncHandler(listGroupJoinRequests));
roomRoutes.patch(
  "/group/:roomId/requests/:userId",
  authMiddleware,
  asyncHandler(respondGroupJoinRequest)
);
roomRoutes.delete("/group/:roomId", authMiddleware, asyncHandler(deleteGroupRoom));

module.exports = { roomRoutes };
