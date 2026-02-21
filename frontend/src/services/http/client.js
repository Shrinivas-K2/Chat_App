import axios from "axios";
import { authStorage } from "../storage/authStorage";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

export const httpClient = axios.create({
  baseURL,
  timeout: 10000,
});

httpClient.interceptors.request.use((config) => {
  const auth = authStorage.get();
  if (auth?.token) {
    config.headers.Authorization = `Bearer ${auth.token}`;
  }
  return config;
});
