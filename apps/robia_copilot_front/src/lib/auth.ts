import { AuthResponse } from "@/types";
import { sessionStore } from "@/lib/session";

export function persistAuthResponse(data: AuthResponse): void {
  const token = data.accessToken ?? data.token;
  if (token) {
    sessionStore.setToken(token);
  }
}
