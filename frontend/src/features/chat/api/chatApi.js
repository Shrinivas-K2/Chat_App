import { httpClient } from "../../../services/http/client";

export async function getRoomsApi() {
  const response = await httpClient.get("/rooms");
  return response.data.rooms || [];
}

export async function createGroupRoomApi(payload) {
  const response = await httpClient.post("/rooms/group", payload);
  return response.data.room;
}

export async function createPrivateRoomApi(payload) {
  const response = await httpClient.post("/rooms/private", payload);
  return response.data;
}

export async function deleteGroupRoomApi(roomId) {
  const response = await httpClient.delete(`/rooms/group/${roomId}`);
  return response.data;
}

export async function getPrivateRequestsApi() {
  const response = await httpClient.get("/rooms/private/requests");
  return response.data.requests || [];
}

export async function respondPrivateRequestApi(roomId, action) {
  const response = await httpClient.patch(`/rooms/private/requests/${roomId}`, { action });
  return response.data;
}
