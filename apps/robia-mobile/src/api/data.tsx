import { normalizeWebsiteUrl } from '@/src/api/presentation';
import { ApiError, queryString } from '@/src/api/client';
import type { ActionItem, ActionStatus, Audit, Opportunity, RobiaDocument, Website } from '@/src/api/types';
import { useSession } from '@/src/auth/session';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { AppState } from 'react-native';

type Snapshot = { websites: Website[]; latestAudit: Audit | null; opportunities: Opportunity[]; documents: RobiaDocument[]; actions: ActionItem[] };
const EMPTY: Snapshot = { websites: [], latestAudit: null, opportunities: [], documents: [], actions: [] };
type DataValue = Snapshot & {
  selectedWebsiteId: string | null; selectWebsite(id: string): void;
  isLoading: boolean; error: string | null; refresh(): Promise<void>;
  runAudit(url: string, multiPage?: boolean): Promise<Audit>;
  generateDocument(opportunityId: string, type?: string): Promise<void>;
  generateActions(opportunityId: string): Promise<void>; generatePlan(): Promise<void>;
  updateActionStatus(id: string, status: ActionStatus): Promise<void>;
};
const DataContext = createContext<DataValue | null>(null);
export function RobiaDataProvider({ children }: PropsWithChildren) {
  const { token, organization, request } = useSession();
  const scope = token && organization ? token + ':' + organization.id : '';
  const scopeRef = useRef(scope); scopeRef.current = scope;
  const [snapshot, setSnapshot] = useState<Snapshot>(EMPTY);
  const [loadedScope, setLoadedScope] = useState('');
  const [selection, setSelection] = useState<{ scope: string; id: string } | null>(null);
  const selectedWebsiteId = selection?.scope === scope ? selection.id : null;
  const selectedRef = useRef(selectedWebsiteId); selectedRef.current = selectedWebsiteId;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const version = useRef(0);
  const selectWebsite = useCallback((id: string) => {
    version.current++; selectedRef.current = id; setSnapshot(current => ({ ...EMPTY, websites: current.websites })); setError(null); setSelection({ scope, id });
  }, [scope]);
  const refresh = useCallback(async () => {
    const run = ++version.current;
    if (!scope) { setSnapshot(EMPTY); setLoadedScope(''); setError(null); setIsLoading(false); return; }
    setIsLoading(true); setError(null);
    const current = () => run === version.current && scopeRef.current === scope;
    try {
      const websites = await request<Website[]>('/websites');
      const site = websites.find(s => s.id === selectedRef.current) ?? websites[0];
      const next: Snapshot = { ...EMPTY, websites };
      if (site) {
        const [actions, audit] = await Promise.all([
          request<ActionItem[]>('/actions' + queryString({ website_id: site.id })),
          request<Audit | null>('/audits/latest' + queryString({ website_id: site.id })).catch(error => {
            if (error instanceof ApiError && error.status === 404) return null; throw error;
          }),
        ]);
        next.actions = actions; next.latestAudit = audit;
        if (audit?.status === 'completed') {
          next.opportunities = await request<Opportunity[]>('/opportunities' + queryString({ audit_id: audit.id }));
          const groups = await Promise.allSettled(next.opportunities.map(o => request<RobiaDocument[]>('/documents' + queryString({ opportunity_id: o.id }))));
          next.documents = groups.flatMap(g => g.status === 'fulfilled' ? g.value : []);
          if (current() && groups.some(g => g.status === 'rejected')) setError('Certains documents sont indisponibles. Actualisez pour réessayer.');
        }
      }
      if (current()) {
        setSnapshot(next); setLoadedScope(scope);
        if (site && site.id !== selectedRef.current) { selectedRef.current = site.id; setSelection({ scope, id: site.id }); }
      }
    } catch (cause) { if (current()) setError(cause instanceof Error ? cause.message : 'Chargement impossible.'); }
    finally { if (current()) setIsLoading(false); }
  }, [request, scope]);
  const invalidate = useCallback(() => { version.current++; }, []);
  useEffect(() => { void refresh(); return invalidate; }, [invalidate, refresh, selectedWebsiteId]);
  useEffect(() => {
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    return () => listener.remove();
  }, [refresh]);
  useEffect(() => {
    if (isLoading || !['pending', 'running'].includes(snapshot.latestAudit?.status ?? '')) return;
    const timer = setTimeout(() => { if (AppState.currentState === 'active') void refresh(); }, 5000);
    return () => clearTimeout(timer);
  }, [snapshot.latestAudit, error, isLoading, refresh]);
  const auditLock = useRef(false);
  const runAudit = useCallback(async (url: string, multiPage = false) => {
    if (auditLock.current) throw new Error("Une analyse est déjà en cours. Consultez son statut avant de recommencer.");
    auditLock.current = true;
    try {
    const normalized = normalizeWebsiteUrl(url);
    const mutationScope = scope;
    let site = snapshot.websites.find(s => normalizeWebsiteUrl(s.url) === normalized);
    if (!site) site = await request<Website>('/websites', { method: 'POST', body: { url: normalized } });
    if (scopeRef.current !== mutationScope) throw new Error('La session a changé.');
    selectedRef.current = site.id; setSelection({ scope, id: site.id });
    const audit = await request<Audit>(multiPage ? '/audits/run-site' : '/audits/run', {
      method: 'POST', body: { websiteId: site.id, ...(multiPage ? { maxPages: 20, maxDepth: 2 } : {}) }, timeoutMs: 180000,
    }).catch(async error => {
      if (scopeRef.current === mutationScope) await refresh();
      throw error;
    });
    if (scopeRef.current !== mutationScope) return audit;
    if (audit.status === 'completed') {
      try { await request(multiPage ? '/opportunities/generate-site' : '/opportunities/generate', { method: 'POST', body: { auditId: audit.id }, timeoutMs: 180000 }); }
      catch { await refresh(); throw new Error('Audit terminé. La génération des opportunités a échoué ; relancez-la depuis Opportunités.'); }
    }
    await refresh();
    if (audit.status === 'failed') throw new Error(audit.errorMessage || 'L’audit a échoué.');
    return audit;
    } finally { auditLock.current = false; }
  }, [request, refresh, scope, snapshot.websites]);
  const generateDocument = useCallback(async (opportunityId: string, type = 'checklist') => {
    await request('/documents/generate', { method: 'POST', body: { opportunityId, type }, timeoutMs: 180000 }); await refresh();
  }, [request, refresh]);
  const generateActions = useCallback(async (opportunityId: string) => {
    await request('/actions/generate' + queryString({ opportunity_id: opportunityId }), { method: 'POST', timeoutMs: 180000 }); await refresh();
  }, [request, refresh]);
  const generatePlan = useCallback(async () => { await request('/actions/plan', { method: 'POST', timeoutMs: 180000 }); await refresh(); }, [request, refresh]);
  const updateActionStatus = useCallback(async (id: string, status: ActionStatus) => {
    await request('/actions/' + encodeURIComponent(id) + '/status', { method: 'PATCH', body: { status } }); await refresh();
  }, [request, refresh]);
  const visible = loadedScope === scope ? snapshot : EMPTY;
  const value = useMemo(() => ({ ...visible, selectedWebsiteId, selectWebsite, isLoading, error, refresh, runAudit, generateDocument, generateActions, generatePlan, updateActionStatus }),
    [visible, selectedWebsiteId, selectWebsite, isLoading, error, refresh, runAudit, generateDocument, generateActions, generatePlan, updateActionStatus]);
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
export function useRobiaData() { const value = useContext(DataContext); if (!value) throw new Error('RobiaDataProvider manquant'); return value; }
