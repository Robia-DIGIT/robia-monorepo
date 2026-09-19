const DEFAULT_API_URL = 'https://api.robiacopilot.site';
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL).replace(/\/$/, '');
export type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown; timeoutMs?: number; responseType?: 'json' | 'blob' };
export type ApiOptions = RequestOptions & { token?: string | null };
export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly details?: unknown) { super(message); this.name = 'ApiError'; }
}
export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { body, token, headers, signal, timeoutMs = 30000, responseType = 'json', ...rest } = options;
  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  try {
    const requestHeaders = new Headers(headers);
    requestHeaders.set('Accept', responseType === 'blob' ? 'application/pdf' : 'application/json');
    if (body !== undefined) requestHeaders.set('Content-Type', 'application/json');
    if (token) requestHeaders.set('Authorization', 'Bearer ' + token);
    const response = await fetch(API_URL + (path.startsWith('/') ? path : '/' + path), {
      ...rest, headers: requestHeaders, body: body === undefined ? undefined : JSON.stringify(body), signal: controller.signal,
    });
    if (response.ok && responseType === 'blob') {
      if (!response.headers.get('content-type')?.includes('application/pdf')) throw new ApiError('Le serveur ne renvoie pas un PDF valide.', 502);
      return await response.blob() as T;
    }
    const text = await response.text();
    let payload: unknown = text;
    if (text && response.headers.get('content-type')?.includes('json')) {
      try { payload = JSON.parse(text); } catch { throw new ApiError('Réponse serveur illisible.', response.ok ? 502 : response.status); }
    }
    if (!response.ok) {
      const message = payload && typeof payload === 'object' && 'message' in payload ? payload.message : null;
      throw new ApiError(Array.isArray(message) ? message.join('\n') : typeof message === 'string' ? message : 'Erreur serveur (' + response.status + ')', response.status, payload);
    }
    if (response.status !== 204 && (!text || typeof payload === 'string')) throw new ApiError('Réponse serveur inattendue. Réessayez dans quelques instants.', 502);
    return (response.status === 204 ? undefined : payload) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (controller.signal.aborted) throw new ApiError(timedOut ? 'Le serveur prend trop de temps. Actualisez pour vérifier le résultat avant de recommencer.' : 'Requête annulée.', 0);
    throw new ApiError('Connexion impossible. Vérifiez votre réseau puis réessayez.', 0);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}
export function queryString(params: Record<string, string | undefined>) {
  const query = Object.entries(params).filter((entry): entry is [string, string] => entry[1] !== undefined)
    .map(([key, value]) => encodeURIComponent(key) + '=' + encodeURIComponent(value)).join('&');
  return query ? '?' + query : '';
}
