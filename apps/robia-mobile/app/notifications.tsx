import { useState } from 'react';
import { Text } from 'react-native';
import { AsyncButton, Choices, LoadState, apiStyles as s } from '@/components/api-ui';
import { RobiaCard, RobiaHeader, RobiaScreen } from '@/components/robia-ui';
import { Status, dateLabel } from '@/components/workspace-ui';
import { useResource } from '@/src/api/use-resource';
import { useSession } from '@/src/auth/session';
type Delivery = { id: string; templateKey: string; status: string; attemptCount: number; recipientMasked: string; lastError: string | null; sentAt: string | null; nextAttemptAt: string; createdAt: string };
const templates: Record<string,string> = { audit_completed: 'Audit termin?', automation_failed: '?chec d?automatisation', weekly_opportunities_summary: 'Bilan des opportunit?s', odc_candidate_invite: 'Invitation ? poursuivre une candidature' };
function DeliveryDetail({ id, refresh }: { id: string; refresh(): Promise<unknown> }) {
  const { request } = useSession(); const r = useResource<Delivery>('/ops/notifications/' + encodeURIComponent(id));
  const d = r.data;
  return <RobiaCard style={s.stack}><Text style={s.title}>D?tail de l?envoi</Text><LoadState {...r} retry={r.reload} />{d ? <><Status value={d.status} /><Text style={s.body}>{d.recipientMasked} ? {d.attemptCount} tentative(s)</Text><Text style={s.body}>Cr?? le {dateLabel(d.createdAt)}</Text><Text style={s.body}>{d.sentAt ? 'Envoy? le ' + dateLabel(d.sentAt) : 'Prochaine tentative pr?vue : ' + dateLabel(d.nextAttemptAt)}</Text>{d.lastError ? <Text style={s.body}>{d.lastError}</Text> : null}
    {d.status === 'dead_letter' && d.attemptCount < 5 ? <AsyncButton label="Redemander l?envoi" confirm="Remettre cet e-mail en attente d?envoi ?" action={async () => { await request('/ops/notifications/' + encodeURIComponent(id) + '/retry', { method: 'POST' }); await r.reload(); await refresh(); }} /> : null}
  </> : null}</RobiaCard>;
}
export default function NotificationsScreen() {
  const list = useResource<Delivery[]>('/ops/notifications', { pollIntervalMs: 15000, shouldPoll: rows => !!rows?.some(d => ['pending','sending'].includes(d.status)) });
  const [filter, setFilter] = useState('all'); const [selected, setSelected] = useState<string | null>(null);
  const visible = list.data?.filter(d => filter === 'all' || (filter === 'sent' ? d.status === 'sent' : d.status === 'dead_letter'));
  return <RobiaScreen fixedHeader><RobiaHeader compact back title="Suivi des envois" subtitle="Les e-mails d?clench?s par vos automatisations." />
    <Choices value={filter} onChange={setFilter} options={[{ value: 'all', label: 'Tous' }, { value: 'sent', label: 'Envoy?s' }, { value: 'failed', label: '? v?rifier' }]} />
    <AsyncButton label="Actualiser" action={list.reload} /><LoadState {...list} retry={list.reload} empty={!visible?.length} />
    {visible?.map(d => <RobiaCard key={d.id} style={s.stack}><Text style={s.title}>{templates[d.templateKey] ?? 'Notification ROBIA'}</Text><Status value={d.status} /><Text style={s.body}>{d.recipientMasked} ? {dateLabel(d.createdAt)}</Text><AsyncButton label="Voir le d?tail" action={async () => setSelected(d.id)} />{selected === d.id ? <DeliveryDetail id={d.id} refresh={list.reload} /> : null}</RobiaCard>)}
  </RobiaScreen>;
}
