import { httpClient } from "../../../services/http/client";

export async function setGenderApi(payload) {
  const response = await httpClient.patch("/users/gender", payload);
  return response.data;
}

export async function getConnectedUsersApi() {
  const response = await httpClient.get("/users/connected");
  return response.data.users || [];
}
