import axios from "axios";
import { sessionStore } from "@/lib/session";

export const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL || "https://robia-back.vercel.app",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for authorization tokens
api.interceptors.request.use((config) => {
  const token = sessionStore.getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
