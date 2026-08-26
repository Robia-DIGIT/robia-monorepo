const AUTH_STORAGE_KEY = "robia_auth_response";
const ACCESS_TOKEN_KEY = "robia_access_token";

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage;
}

export function persistAuthResponse(response: unknown) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(response));

  const accessToken = extractAccessToken(response);

  if (accessToken) {
    storage.setItem(ACCESS_TOKEN_KEY, accessToken);
  } else {
    storage.removeItem(ACCESS_TOKEN_KEY);
  }

  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
}

export function readAuthResponse<T = unknown>() {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  const rawResponse = storage.getItem(AUTH_STORAGE_KEY);

  if (!rawResponse) {
    return null;
  }

  try {
    return JSON.parse(rawResponse) as T;
  } catch {
    return null;
  }
}

export function clearAuthResponse() {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.removeItem(AUTH_STORAGE_KEY);
  storage.removeItem(ACCESS_TOKEN_KEY);

  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
}

export function getStoredAccessToken() {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  return storage.getItem(ACCESS_TOKEN_KEY);
}

export function isAuthenticated() {
  const token = getStoredAccessToken();
  return typeof token === "string" && token.trim().length > 0;
}

export function extractAccessToken(response: unknown) {
  if (!response || typeof response !== "object") {
    return null;
  }

  const record = response as Record<string, unknown>;

  if (typeof record.accessToken === "string" && record.accessToken) {
    return record.accessToken;
  }

  if (typeof record.token === "string" && record.token) {
    return record.token;
  }

  if (typeof record.access_token === "string" && record.access_token) {
    return record.access_token;
  }

  return null;
}

export async function getApiErrorMessage(
  response: Response,
  fallbackMessage: string,
) {
  try {
    const body = (await response.json()) as { message?: unknown };

    if (typeof body.message === "string") {
      return body.message;
    }

    if (Array.isArray(body.message)) {
      return body.message.join(", ");
    }
  } catch {
    // Ignore malformed error bodies and keep the fallback message.
  }

  return fallbackMessage;
}