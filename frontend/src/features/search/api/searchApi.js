import { httpClient } from "../../../services/http/client";

export async function searchUsersApi(query) {
  const response = await httpClient.get(`/users/search?q=${encodeURIComponent(query)}`);
  return response.data.users || [];
}
