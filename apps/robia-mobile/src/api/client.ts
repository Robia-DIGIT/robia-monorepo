const DEFAULT_API_URL = 'https://api.robiacopilot.site';
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL).replace(/\/$/, '');
type ApiOptions = Omit<RequestInit, 'body'> & { body?: unknown; token?: string | null };
export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly details?: unknown) { super(message); this.name = 'ApiError'; }
}
export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { body, token, headers, ...requestOptions } = options;
  const response = await fetch(`${API_URL}${path.startsWith('/') ? path : `/${path}`}`, {
    ...requestOptions,
    headers: { Accept: 'application/json', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) {
    const message = typeof payload === 'object' && payload && 'message' in payload ? String(Array.isArray(payload.message) ? payload.message.join('\n') : payload.message) : `Erreur serveur (${response.status})`;
    throw new ApiError(message, response.status, payload);
  }
  return payload as T;
}
export function queryString(params: Record<string, string | undefined>) {
  const query = Object.entries(params).filter((entry): entry is [string, string] => Boolean(entry[1])).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&');
  return query ? `?${query}` : '';
}
