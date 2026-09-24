import { AsyncButton, Field, LoadState, apiStyles as s } from '@/components/api-ui';
import { RobiaCard, RobiaHeader, RobiaScreen } from '@/components/robia-ui';
import { AutomationEditor } from '@/components/automation-editor';
import { ACTIONS, hasEventInput, type Automation } from '@/src/api/automations';
import { useResource } from '@/src/api/use-resource';
import { useSession } from '@/src/auth/session';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
type Run = { id: string; status: string; createdAt: string; errorMessage?: string; steps?: { id: string; actionType: string; status: string; errorMessage?: string; attemptCount?: number; nextAttemptAt?: string; evidence?: Record<string, unknown> }[] };
const ACTIONS = [
  { value: 'robia.report.prepare_organization_summary', label: 'Préparer un bilan' },
  { value: 'robia.audit.run_diagnostic', label: 'Analyser un site' },
  { value: 'robia.opportunities.regenerate', label: 'Générer les priorités' },
  { value: 'robia.action_items.create_internal_task', label: 'Créer une tâche interne' },
];
const statusLabels: Record<string, string> = { waiting_approval: 'À approuver', queued: 'En attente', running: 'En cours', succeeded: 'Réussie', failed: 'Échouée', cancelled: 'Annulée', skipped: 'Non exécutée' };
function RunDetail({ id, reloadParent }: { id: string; reloadParent(): Promise<unknown> }) {
  const { request } = useSession(); const r = useResource<Run>('/ops/automations/runs/' + encodeURIComponent(id), { pollIntervalMs: 5000, shouldPoll: run => !!run && ['queued', 'running'].includes(run.status) }); const [reason, setReason] = useState('');
  return <RobiaCard style={s.stack}><Text style={s.title}>Détail de l’exécution</Text><LoadState {...r} retry={r.reload} />
    {r.data ? <><Text style={s.body}>{statusLabels[r.data.status] ?? r.data.status}</Text>
      {r.data.errorMessage ? <Text style={s.body}>{r.data.errorMessage}</Text> : null}
      {r.data.steps?.map(step => <View key={step.id} style={s.stack}><Text style={s.body}>{ACTIONS.find(a => a.value === step.actionType)?.label ?? 'Étape'} : {statusLabels[step.status] ?? step.status}</Text>
        {step.attemptCount != null ? <Text style={s.body}>Tentatives : {step.attemptCount}{step.nextAttemptAt ? ' ? Prochaine : ' + new Date(step.nextAttemptAt).toLocaleString('fr-FR') : ''}</Text> : null}
        {step.errorMessage ? <Text style={s.body}>{step.errorMessage}</Text> : null}
        {step.evidence ? Object.entries(step.evidence).filter(([k, v]) => ['websiteCount', 'openOpportunityCount', 'pendingActionCount', 'opportunityCount', 'globalScore'].includes(k) && typeof v === 'number').map(([k,v]) => <Text key={k} style={s.body}>{{ websiteCount: 'Sites', openOpportunityCount: 'Opportunités ouvertes', pendingActionCount: 'Actions à faire', opportunityCount: 'Opportunités', globalScore: 'Score' }[k]} : {String(v)}</Text>) : null}
      </View>)}
      {r.data.status === 'waiting_approval' ? <><Field label="Commentaire (facultatif)" value={reason} onChangeText={setReason} />
        <AsyncButton label="Approuver cette exécution" confirm="Exécuter les étapes de cette automatisation ?" action={async () => { await request('/ops/automations/runs/' + id + '/approve', { method: 'POST', body: { reason }, timeoutMs: 180000 }); await r.reload(); await reloadParent(); }} />
        <AsyncButton label="Rejeter cette exécution" action={async () => { await request('/ops/automations/runs/' + id + '/reject', { method: 'POST', body: { reason } }); await r.reload(); await reloadParent(); }} />
      </> : null}<AsyncButton label="Actualiser le résultat" action={r.reload} /></> : null}
  </RobiaCard>;
}
function AutomationDetail({ id, reloadParent }: { id: string; reloadParent(): Promise<unknown> }) {
  const { request } = useSession(); const path = '/ops/automations/' + encodeURIComponent(id);
  const r = useResource<Automation>(path); const runs = useResource<Run[]>(path + '/runs');
  const [editing, setEditing] = useState(false); const [runId, setRunId] = useState<string | null>(null);
  const reload = async () => { await Promise.all([r.reload(), runs.reload(), reloadParent()]); };
  return <><RobiaCard style={s.stack}><LoadState {...r} retry={r.reload} />
    {r.data ? <><Text style={s.title}>{r.data.name}</Text><Text style={s.body}>{r.data.description}</Text>
      <Text style={s.body}>{r.data.enabled ? 'Active' : 'Désactivée'} · {r.data.requiresApproval ? 'Validation humaine requise' : 'Sans approbation préalable'}</Text>
      <Text style={s.body}>Déclenchement : {r.data.trigger.type === "manual" ? "À la demande" : r.data.trigger.type === "scheduled" ? "Horaire enregistré ; lancement automatique indisponible" : "Événement enregistré ; déclenchement automatique indisponible"}</Text>
      <AsyncButton label={editing ? "Fermer la configuration" : "Modifier la configuration"} action={async () => setEditing(!editing)} />
      {editing ? <AutomationEditor automation={r.data} onSaved={async () => { setEditing(false); await reload(); }} /> : null}
      <AsyncButton label={r.data.enabled ? 'Désactiver' : 'Activer'} confirm={r.data.enabled ? undefined : 'Activer cette automatisation selon son déclencheur configuré ?'} action={async () => { await request(path + '/enabled', { method: 'PATCH', body: { enabled: !r.data!.enabled } }); await reload(); }} />
      <AsyncButton label="Lancer maintenant" disabled={!r.data.enabled || hasEventInput(r.data.steps)} confirm="Lancer une nouvelle exécution de cette automatisation ?" action={async () => {
        const run = await request<Run>(path + '/run', { method: 'POST', timeoutMs: 180000 }); setRunId(run.id); await reload();
      }} />
    </> : null}
    <Text style={s.title}>Exécutions</Text><LoadState {...runs} retry={runs.reload} empty={!runs.data?.length} />
    {runs.data?.map(run => <AsyncButton key={run.id} label={new Date(run.createdAt).toLocaleString('fr-FR') + ' · ' + (statusLabels[run.status] ?? run.status)} action={async () => setRunId(run.id)} />)}
  </RobiaCard>{runId ? <RunDetail key={runId} id={runId} reloadParent={reload} /> : null}</>;
}
export default function AutomationsScreen() {
  const { organization } = useSession();
  const list = useResource<Automation[]>(organization ? '/ops/automations' : null);
  const [selected, setSelected] = useState<string | null>(null); const [creating,setCreating] = useState(false);
  return <RobiaScreen fixedHeader><RobiaHeader compact back title="Automatisations" />
    {!organization ? <AsyncButton label="Compl?ter mon entreprise" action={async () => router.push('/settings')} /> : null}
    <AsyncButton label={creating ? 'Fermer le formulaire' : 'Cr?er une automatisation'} disabled={!organization} action={async () => setCreating(!creating)} />
    {creating ? <AutomationEditor onSaved={async a => { setCreating(false); setSelected(a.id); await list.reload(); }} /> : null}
    <LoadState {...list} retry={list.reload} empty={!list.data?.length} />
    {list.data?.map(a => <View key={a.id} style={s.stack}><AsyncButton label={a.name + (a.enabled ? ' ? Active' : ' ? D?sactiv?e')} action={async () => setSelected(selected === a.id ? null : a.id)} />
      {selected === a.id ? <AutomationDetail id={a.id} reloadParent={list.reload} /> : null}</View>)}
  </RobiaScreen>;
}
