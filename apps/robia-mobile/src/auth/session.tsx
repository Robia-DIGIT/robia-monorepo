import { ApiError, apiRequest, type RequestOptions } from "@/src/api/client";
import type { AuthResponse, Organization, User } from "@/src/api/types";
import * as SecureStore from "expo-secure-store";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { Platform } from "react-native";
const TOKEN_KEY = "robia.access-token";
async function readToken() {
  return Platform.OS === "web"
    ? (globalThis.localStorage?.getItem(TOKEN_KEY) ?? null)
    : SecureStore.getItemAsync(TOKEN_KEY);
}
async function persistToken(token: string | null) {
  if (Platform.OS === "web") {
    if (token) globalThis.localStorage?.setItem(TOKEN_KEY, token);
    else globalThis.localStorage?.removeItem(TOKEN_KEY);
  } else if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}
let storageQueue: Promise<void> = Promise.resolve();
function writeToken(token: string | null) {
  const write = storageQueue.catch(() => {}).then(() => persistToken(token));
  storageQueue = write;
  return write;
}

type SessionValue = {
  token: string | null;
  user: User | null;
  organization: Organization | null;
  isLoading: boolean;
  sessionError: string | null;
  login(email: string, password: string): Promise<void>;
  register(input: {
    name: string;
    company: string;
    email: string;
    password: string;
  }): Promise<void>;
  logout(): Promise<void>;
  restore(): Promise<void>;
  refreshProfile(): Promise<void>;
  refreshOrganization(): Promise<Organization | null>;
  request<T>(path: string, options?: RequestOptions): Promise<T>;
};
const SessionContext = createContext<SessionValue | null>(null);
export function SessionProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const generation = useRef(0);
  const clearSession = useCallback(async () => {
    generation.current++;
    tokenRef.current = null;
    setToken(null);
    setUser(null);
    setOrganization(null);
    setSessionError(null);
    setIsLoading(false);
    await writeToken(null);
  }, []);
  const loadOrganization = useCallback(async (accessToken: string) => {
    try {
      const current = await apiRequest<Organization>("/organizations/current", {
        token: accessToken,
      });
      if (tokenRef.current === accessToken) setOrganization(current);
      return current;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        if (tokenRef.current === accessToken) setOrganization(null);
        return null;
      }
      throw error;
    }
  }, []);
  const restore = useCallback(async () => {
    const version = ++generation.current;
    setIsLoading(true);
    setSessionError(null);
    try {
      const stored = await readToken();
      if (!stored || generation.current !== version) return;
      tokenRef.current = stored;
      const profile = await apiRequest<User>("/users/me", { token: stored });
      if (generation.current !== version) return;
      setToken(stored);
      setUser(profile);
      await loadOrganization(stored);
    } catch (error) {
      if (generation.current !== version) return;
      if (error instanceof ApiError && error.status === 401)
        await clearSession();
      else
        setSessionError(
          error instanceof Error
            ? error.message
            : "Impossible de restaurer la session.",
        );
    } finally {
      if (generation.current === version || !tokenRef.current)
        setIsLoading(false);
    }
  }, [clearSession, loadOrganization]);
  useEffect(() => {
    void restore();
  }, [restore]);
  const establish = useCallback(
    async (auth: AuthResponse, version: number) => {
      if (
        !auth ||
        typeof auth.accessToken !== "string" ||
        !auth.accessToken ||
        !auth.user?.id
      )
        throw new ApiError("Réponse de connexion incomplète.", 502);
      if (version !== generation.current)
        throw new ApiError("La session a changé.", 0);
      await writeToken(auth.accessToken);
      if (version !== generation.current)
        throw new ApiError("La session a changé.", 0);
      tokenRef.current = auth.accessToken;
      setUser(auth.user);
      setOrganization(null);
      setSessionError(null);
      // Keep a valid account usable even when organisation setup needs to be retried.
      setToken(auth.accessToken);
      setIsLoading(false);
      try {
        await loadOrganization(auth.accessToken);
      } catch (error) {
        if (generation.current === version)
          setSessionError(
            error instanceof Error
              ? error.message
              : "Organisation indisponible.",
          );
      }
    },
    [loadOrganization],
  );
  const login = useCallback(
    async (email: string, password: string) => {
      const version = ++generation.current;
      await establish(
        await apiRequest<AuthResponse>("/auth/login", {
          method: "POST",
          body: { email: email.trim().toLowerCase(), password },
        }),
        version,
      );
    },
    [establish],
  );
  const register = useCallback(
    async (input: {
      name: string;
      company: string;
      email: string;
      password: string;
    }) => {
      const version = ++generation.current;
      const auth = await apiRequest<AuthResponse>("/auth/register", {
        method: "POST",
        body: { ...input, email: input.email.trim().toLowerCase() },
      });
      await establish(auth, version);
      if (generation.current !== version) return;
      try {
        const created = await apiRequest<Organization>("/organizations", {
          method: "POST",
          token: auth.accessToken,
          body: { name: input.company },
        });
        if (tokenRef.current === auth.accessToken) setOrganization(created);
      } catch (error) {
        if (generation.current === version)
          setSessionError(
            "Compte créé. Complétez votre organisation dans les paramètres. " +
              (error instanceof Error ? error.message : ""),
          );
      }
    },
    [establish],
  );
  const logout = useCallback(async () => {
    const previous = tokenRef.current;
    await clearSession();
    if (previous)
      void apiRequest("/auth/logout", {
        method: "POST",
        token: previous,
      }).catch(() => {});
  }, [clearSession]);
  const request = useCallback(
    async <T,>(path: string, options: RequestOptions = {}) => {
      const current = tokenRef.current;
      if (!current) throw new ApiError("Connectez-vous pour continuer.", 401);
      try {
        const result = await apiRequest<T>(path, {
          ...options,
          token: current,
        });
        if (tokenRef.current !== current)
          throw new ApiError("La session a changé. Rechargez cet écran.", 0);
        return result;
      } catch (error) {
        // Provider OAuth failures must not invalidate the ROBIA account.
        if (
          error instanceof ApiError &&
          error.status === 401 &&
          tokenRef.current === current
        ) {
          try {
            await apiRequest("/auth/me", { token: current });
          } catch (probe) {
            if (
              probe instanceof ApiError &&
              probe.status === 401 &&
              tokenRef.current === current
            )
              await clearSession();
          }
        }
        throw error;
      }
    },
    [clearSession],
  );
  const refreshOrganization = useCallback(async () => {
    if (!token) return null;
    const org = await loadOrganization(token);
    setSessionError(null);
    return org;
  }, [loadOrganization, token]);
  const refreshProfile = useCallback(async () => {
    const profile = await request<User>("/users/me");
    if (tokenRef.current === token) setUser(profile);
  }, [request, token]);
  const value = useMemo(
    () => ({
      token,
      user,
      organization,
      isLoading,
      sessionError,
      login,
      register,
      logout,
      restore,
      request,
      refreshOrganization,
      refreshProfile,
    }),
    [
      token,
      user,
      organization,
      isLoading,
      sessionError,
      login,
      register,
      logout,
      restore,
      request,
      refreshOrganization,
      refreshProfile,
    ],
  );
  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("SessionProvider manquant");
  return value;
}
