import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { ApiError, apiRequest } from '@/src/api/client';
import type { AuthResponse, Organization, User } from '@/src/api/types';
const TOKEN_KEY = 'robia.access-token';
async function readToken() { return Platform.OS === 'web' ? globalThis.localStorage?.getItem(TOKEN_KEY) ?? null : SecureStore.getItemAsync(TOKEN_KEY); }
async function writeToken(token: string | null) {
  if (Platform.OS === 'web') {
    if (token) globalThis.localStorage?.setItem(TOKEN_KEY, token);
    else globalThis.localStorage?.removeItem(TOKEN_KEY);
    return;
  }
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token); else await SecureStore.deleteItemAsync(TOKEN_KEY);
}
type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown };
type SessionValue = { token: string | null; user: User | null; organization: Organization | null; isLoading: boolean; login(email: string, password: string): Promise<void>; register(input: { name: string; company: string; email: string; password: string }): Promise<void>; logout(): Promise<void>; refreshOrganization(): Promise<Organization | null>; request<T>(path: string, options?: RequestOptions): Promise<T> };
const SessionContext = createContext<SessionValue | null>(null);
export function SessionProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(null); const [user, setUser] = useState<User | null>(null); const [organization, setOrganization] = useState<Organization | null>(null); const [isLoading, setIsLoading] = useState(true);
  const clearSession = useCallback(async () => { setToken(null); setUser(null); setOrganization(null); await writeToken(null); }, []);
  const loadOrganization = useCallback(async (accessToken: string) => { try { const current = await apiRequest<Organization>('/organizations/current', { token: accessToken }); setOrganization(current); return current; } catch (error) { if (error instanceof ApiError && error.status === 404) { setOrganization(null); return null; } throw error; } }, []);
  useEffect(() => { void (async () => { try { const stored = await readToken(); if (!stored) return; const profile = await apiRequest<User>('/auth/me', { token: stored }); setToken(stored); setUser(profile); await loadOrganization(stored); } catch { await clearSession(); } finally { setIsLoading(false); } })(); }, [clearSession, loadOrganization]);
  const login = useCallback(async (email: string, password: string) => { const auth = await apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: { email: email.trim().toLowerCase(), password } }); await writeToken(auth.accessToken); setToken(auth.accessToken); setUser(auth.user); await loadOrganization(auth.accessToken); }, [loadOrganization]);
  const register = useCallback(async (input: { name: string; company: string; email: string; password: string }) => { const auth = await apiRequest<AuthResponse>('/auth/register', { method: 'POST', body: { ...input, email: input.email.trim().toLowerCase() } }); await writeToken(auth.accessToken); setToken(auth.accessToken); setUser(auth.user); const created = await apiRequest<Organization>('/organizations', { method: 'POST', token: auth.accessToken, body: { name: input.company } }); setOrganization(created); }, []);
  const logout = useCallback(async () => { if (token) { try { await apiRequest('/auth/logout', { method: 'POST', token }); } catch {} } await clearSession(); }, [clearSession, token]);
  const request = useCallback(<T,>(path: string, options: RequestOptions = {}) => { if (!token) return Promise.reject(new ApiError('Session expirée', 401)); return apiRequest<T>(path, { ...options, token }); }, [token]);
  const refreshOrganization = useCallback(() => token ? loadOrganization(token) : Promise.resolve(null), [loadOrganization, token]);
  const value = useMemo(() => ({ token, user, organization, isLoading, login, register, logout, request, refreshOrganization }), [token, user, organization, isLoading, login, register, logout, request, refreshOrganization]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
export function useSession() { const value = useContext(SessionContext); if (!value) throw new Error('SessionProvider manquant'); return value; }
