import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { ApiError, queryString } from '@/src/api/client';
import type { ActionItem, ActionStatus, Audit, Opportunity, RobiaDocument, Website } from '@/src/api/types';
import { useSession } from '@/src/auth/session';

type DataValue = {
  websites: Website[]; latestAudit: Audit | null; opportunities: Opportunity[]; documents: RobiaDocument[]; actions: ActionItem[];
  isLoading: boolean; error: string | null; refresh(): Promise<void>;
  runAudit(url: string): Promise<Audit>; generateDocument(opportunityId: string, type?: string): Promise<void>;
  generateActions(opportunityId: string): Promise<void>; generatePlan(): Promise<void>; updateActionStatus(id: string, status: ActionStatus): Promise<void>;
};
const DataContext = createContext<DataValue | null>(null);

export function RobiaDataProvider({ children }: PropsWithChildren) {
  const { token, organization, request } = useSession();
  const [websites, setWebsites] = useState<Website[]>([]); const [latestAudit, setLatestAudit] = useState<Audit | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]); const [documents, setDocuments] = useState<RobiaDocument[]>([]);
  const [actions, setActions] = useState<ActionItem[]>([]); const [isLoading, setIsLoading] = useState(false); const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token || !organization) return;
    setIsLoading(true); setError(null);
    try {
      const siteList = await request<Website[]>('/websites'); setWebsites(siteList);
      const site = siteList[0];
      const actionList = await request<ActionItem[]>('/actions'); setActions(actionList);
      if (!site) { setLatestAudit(null); setOpportunities([]); setDocuments([]); return; }
      let audit: Audit | null = null;
      try { audit = await request<Audit>(`/audits/latest${queryString({ website_id: site.id })}`); }
      catch (cause) { if (!(cause instanceof ApiError && cause.status === 404)) throw cause; }
      setLatestAudit(audit);
      if (!audit) { setOpportunities([]); setDocuments([]); return; }
      const opportunityList = await request<Opportunity[]>(`/opportunities${queryString({ audit_id: audit.id })}`); setOpportunities(opportunityList);
      const groups = await Promise.all(opportunityList.map((item) => request<RobiaDocument[]>(`/documents${queryString({ opportunity_id: item.id })}`)));
      setDocuments(groups.flat());
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Impossible de charger les données.'); }
    finally { setIsLoading(false); }
  }, [organization, request, token]);

  useEffect(() => { if (token && organization) void refresh(); else { setWebsites([]); setLatestAudit(null); setOpportunities([]); setDocuments([]); setActions([]); } }, [organization, refresh, token]);

  const runAudit = useCallback(async (url: string) => {
    const normalized = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
    let site = websites.find((item) => item.url.replace(/\/$/, '') === normalized.replace(/\/$/, ''));
    if (!site) site = await request<Website>('/websites', { method: 'POST', body: { url: normalized } });
    const audit = await request<Audit>('/audits/run', { method: 'POST', body: { websiteId: site.id } });
    if (audit.status === 'completed') await request<Opportunity[]>('/opportunities/generate', { method: 'POST', body: { auditId: audit.id } });
    await refresh(); return audit;
  }, [refresh, request, websites]);
  const generateDocument = useCallback(async (opportunityId: string, type = 'checklist') => { await request('/documents/generate', { method: 'POST', body: { opportunityId, type } }); await refresh(); }, [refresh, request]);
  const generateActions = useCallback(async (opportunityId: string) => { await request('/actions/generate', { method: 'POST', body: { opportunityId } }); await refresh(); }, [refresh, request]);
  const generatePlan = useCallback(async () => { await request('/actions/plan', { method: 'POST' }); await refresh(); }, [refresh, request]);
  const updateActionStatus = useCallback(async (id: string, status: ActionStatus) => { setActions((current) => current.map((item) => item.id === id ? { ...item, status } : item)); try { await request(`/actions/${id}/status`, { method: 'PATCH', body: { status } }); } catch (cause) { await refresh(); throw cause; } }, [refresh, request]);
  const value = useMemo(() => ({ websites, latestAudit, opportunities, documents, actions, isLoading, error, refresh, runAudit, generateDocument, generateActions, generatePlan, updateActionStatus }), [websites, latestAudit, opportunities, documents, actions, isLoading, error, refresh, runAudit, generateDocument, generateActions, generatePlan, updateActionStatus]);
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
export function useRobiaData() { const value = useContext(DataContext); if (!value) throw new Error('RobiaDataProvider manquant'); return value; }
