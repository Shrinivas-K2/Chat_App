import { httpClient } from "../../../services/http/client";

export async function getMessagesByRoomApi(roomId) {
  const response = await httpClient.get(`/messages/room/${roomId}`);
  return response.data.messages || [];
}

export async function sendMessageApi(payload) {
  const response = await httpClient.post("/messages", payload);
  return response.data.message;
}

export async function editMessageApi(messageId, payload) {
  const response = await httpClient.patch(`/messages/${messageId}`, payload);
  return response.data.message;
}

export async function deleteMessageApi(messageId) {
  const response = await httpClient.delete(`/messages/${messageId}`);
  return response.data.message;
}

export async function markMessageSeenApi(messageId) {
  const response = await httpClient.patch(`/messages/${messageId}/seen`);
  return response.data;
}

export async function clearChatRoomApi(roomId) {
  const response = await httpClient.patch(`/messages/room/${roomId}/clear`);
  return response.data;
}
