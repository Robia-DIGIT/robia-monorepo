import { useCallback, useEffect, useMemo, useState } from "react";

type Status = "loading" | "ready" | "error";

/**
 * Charge une ressource, garde un brouillon local des champs modifiés, et
 * n'envoie au PATCH que les champs réellement différents de la version
 * serveur — comme le montrent vos exemples d'API (body partiel).
 *
 * Réutilisé pour /users/me et /organizations/current : même logique de
 * chargement / édition / sauvegarde, deux ressources différentes.
 */
export function useEditableResource<T extends object>(
  fetchFn: () => Promise<T>,
  patchFn: (partial: Partial<T>) => Promise<T>,
) {
  const [data, setData] = useState<T | null>(null);
  const [draft, setDraft] = useState<Partial<T>>({});
  const [status, setStatus] = useState<Status>("loading");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    fetchFn()
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [reloadNonce]);

  useEffect(() => {
    if (!justSaved) return;
    const t = setTimeout(() => setJustSaved(false), 2500);
    return () => clearTimeout(t);
  }, [justSaved]);

  const setField = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setSaveError(null);
  }, []);

  const dirtyKeys = useMemo(() => {
    if (!data) return [] as (keyof T)[];
    return (Object.keys(draft) as (keyof T)[]).filter((k) => draft[k] !== data[k]);
  }, [draft, data]);

  const isDirty = dirtyKeys.length > 0;

  // Vue fusionnée data + brouillon, pour piloter des inputs contrôlés.
  const values = useMemo(() => ({ ...(data ?? {}), ...draft }) as T, [data, draft]);

  const discardDraft = useCallback(() => {
    setDraft({});
    setSaveError(null);
  }, []);

  const save = useCallback(async () => {
    if (!data || dirtyKeys.length === 0) return true;
    const partial: Partial<T> = {};
    dirtyKeys.forEach((k) => {
      partial[k] = draft[k] as T[typeof k];
    });

    setSaving(true);
    setSaveError(null);
    try {
      const updated = await patchFn(partial);
      setData(updated);
      setDraft({});
      setJustSaved(true);
      return true;
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Une erreur est survenue.");
      return false;
    } finally {
      setSaving(false);
    }
  }, [data, dirtyKeys, draft, patchFn]);

  const reload = useCallback(() => setReloadNonce((n) => n + 1), []);

  return { data, values, status, setField, isDirty, saving, saveError, justSaved, save, discardDraft, reload };
}