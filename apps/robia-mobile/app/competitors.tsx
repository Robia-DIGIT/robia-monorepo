import { useState } from 'react';
import { Text } from 'react-native';
import { AsyncButton, Field, LoadState, apiStyles as s } from '@/components/api-ui';
import { RobiaCard, RobiaHeader, RobiaScreen } from '@/components/robia-ui';
import { SiteSelector } from '@/components/site-selector';
import { Metric, NavCard, Status, dateLabel } from '@/components/workspace-ui';
import { useRobiaData } from '@/src/api/data';
import { useSession } from '@/src/auth/session';
import { useResource } from '@/src/api/use-resource';
import { normalizeWebsiteUrl } from '@/src/api/presentation';
type Competitor = { id: string; name?: string; url: string; status: string; globalScore: number | null; errorMessage?: string; completedAt?: string; resultJson?: Record<string, unknown> };
export default function CompetitorsScreen() {
  const { selectedWebsiteId, latestAudit } = useRobiaData();
  const { request } = useSession();
  const list = useResource<Competitor[]>(selectedWebsiteId ? '/competitors?website_id=' + encodeURIComponent(selectedWebsiteId) : null, { pollIntervalMs: 5000, shouldPoll: rows => !!rows?.some(c => c.status === 'running') });
  const [name, setName] = useState(''); const [url, setUrl] = useState('');
  return <RobiaScreen fixedHeader><RobiaHeader compact back title="Concurrents" subtitle="Comparer les r?sultats d?audits r?alis?s par ROBIA." />
    <SiteSelector />
    {!selectedWebsiteId ? <NavCard title="Ajouter mon site" description="Choisissez d?abord le site auquel rattacher vos concurrents." href="/websites" /> : null}
    <RobiaCard style={s.stack}><Text style={s.title}>Suivre un concurrent</Text><Field label="Nom (facultatif)" value={name} onChangeText={setName} /><Field label="Adresse du site" value={url} onChangeText={setUrl} autoCapitalize="none" keyboardType="url" placeholder="https://exemple.fr" />
      <AsyncButton label="Ajouter le concurrent" disabled={!selectedWebsiteId || !url.trim()} action={async () => { await request('/competitors', { method: 'POST', body: { websiteId: selectedWebsiteId, url: normalizeWebsiteUrl(url), name: name.trim() || undefined } }); setUrl(''); setName(''); await list.reload(); }} />
    </RobiaCard>
    {latestAudit?.globalScore != null ? <RobiaCard><Metric label="Dernier score de mon site" value={latestAudit.globalScore + '/100'} /></RobiaCard> : null}
    <LoadState {...list} retry={list.reload} empty={!!selectedWebsiteId && !list.data?.length} />
    {list.data?.map(c => <RobiaCard key={c.id} style={s.stack}><Text style={s.title}>{c.name || c.url}</Text><Text selectable style={s.body}>{c.url}</Text><Status value={c.status} />
      <Metric label="Score du dernier audit r?ussi" value={c.globalScore == null ? null : c.globalScore + '/100'} />
      <Text style={s.body}>{dateLabel(c.completedAt)}</Text>{c.errorMessage ? <Text style={s.body}>{c.errorMessage}</Text> : null}
      <AsyncButton label="Analyser ce concurrent" disabled={c.status === 'running'} action={async () => { try { const result = await request<Competitor>('/competitors/' + encodeURIComponent(c.id) + '/run', { method: 'POST', timeoutMs: 180000 }); if (result.status === 'failed') throw new Error(result.errorMessage || 'Analyse impossible.'); } finally { await list.reload(); } }} />
      <AsyncButton label="Arr?ter de suivre" confirm={'Retirer ' + (c.name || c.url) + ' de vos concurrents ?'} action={async () => { await request('/competitors/' + encodeURIComponent(c.id), { method: 'DELETE' }); await list.reload(); }} />
    </RobiaCard>)}
  </RobiaScreen>;
}
