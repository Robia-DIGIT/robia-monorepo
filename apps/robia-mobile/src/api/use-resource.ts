import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useSession } from '@/src/auth/session';

type Options<T> = { pollIntervalMs?: number; shouldPoll?: (data: T | null) => boolean };

/** Reads are scoped to the current account and refreshed when the screen is revisited. */
export function useResource<T>(path: string | null, options: Options<T> = {}) {
  const { request, token, organization } = useSession();
  const focused = useIsFocused();
  const [state, setState] = useState<{ key: string; data: T | null; error: string | null; loading: boolean }>({
    key: '', data: null, error: null, loading: false,
  });
  const key = (token ?? '') + ':' + (organization?.id ?? '') + ':' + path;
  const currentKey = useRef(key); currentKey.current = key;
  const version = useRef(0);
  const pending = useRef<AbortController | null>(null);
  const cancel = useCallback(() => {
    version.current++;
    pending.current?.abort();
    pending.current = null;
  }, []);
  const reload = useCallback(async () => {
    cancel();
    if (!path || !token) return;
    const run = version.current;
    const controller = new AbortController();
    pending.current = controller;
    setState(s => ({ key, data: s.key === key ? s.data : null, loading: true, error: null }));
    try {
      const data = await request<T>(path, { signal: controller.signal });
      if (run === version.current && currentKey.current === key) setState({ key, data, loading: false, error: null });
    } catch (error) {
      if (run === version.current && currentKey.current === key) {
        setState(s => ({ ...s, loading: false, error: error instanceof Error ? error.message : 'Chargement impossible.' }));
      }
    } finally {
      if (pending.current === controller) pending.current = null;
    }
  }, [cancel, key, path, request, token]);

  useEffect(() => {
    if (focused) void reload();
    return cancel;
  }, [cancel, focused, reload]);
  useEffect(() => {
    if (!focused) return;
    const sub = AppState.addEventListener('change', s => {
      if (s === 'active') void reload();
      else cancel();
    });
    return () => sub.remove();
  }, [cancel, focused, reload]);

  const shouldPoll = options.shouldPoll?.(state.key === key ? state.data : null) ?? true;
  useEffect(() => {
    if (!focused || !path || !token || !options.pollIntervalMs || !shouldPoll || state.loading) return;
    const timer = setTimeout(() => {
      if (AppState.currentState === 'active') void reload();
    }, options.pollIntervalMs);
    return () => clearTimeout(timer);
  }, [focused, key, options.pollIntervalMs, path, reload, shouldPoll, state, token]);

  return {
    data: state.key === key ? state.data : null,
    error: state.key === key ? state.error : null,
    loading: !!path && !!token && (state.key !== key || state.loading),
    reload,
  };
}
