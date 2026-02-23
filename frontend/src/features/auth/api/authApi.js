import { httpClient } from "../../../services/http/client";

export async function loginApi(payload) {
  const response = await httpClient.post("/auth/login", payload);
  return response.data;
}

export async function signupApi(payload) {
  const username = (payload.username || payload.name || "").trim();
  const response = await httpClient.post("/auth/signup", {
    username,
    email: payload.email,
    password: payload.password,
  });
  return response.data;
}

export async function googleAuthApi(payload) {
  const response = await httpClient.post("/auth/google", payload);
  return response.data;
}

export async function meApi() {
  const response = await httpClient.get("/auth/me");
  return response.data;
}

export async function logoutApi() {
  const response = await httpClient.post("/auth/logout");
  return response.data;
}
