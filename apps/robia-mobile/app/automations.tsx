import { router } from 'expo-router';
import { useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { AsyncButton, Choices, Field, LoadState, apiStyles as s } from '@/components/api-ui';
import { RobiaCard, RobiaHeader, RobiaScreen } from '@/components/robia-ui';
import { useResource } from '@/src/api/use-resource';
import { useSession } from '@/src/auth/session';
import { useRobiaData } from '@/src/api/data';
type Step = { actionType: string; input?: Record<string, string> };
type Automation = { id: string; name: string; description: string | null; enabled: boolean; requiresApproval: boolean; trigger: { type: string; eventType?: string; cronExpression?: string }; steps: Step[] };
type Run = { id: string; status: string; createdAt: string; errorMessage?: string; steps?: { id: string; actionType: string; status: string; errorMessage?: string; evidence?: Record<string, unknown> }[] };
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
  const [name, setName] = useState(''); const [runId, setRunId] = useState<string | null>(null);
  const reload = async () => { await Promise.all([r.reload(), runs.reload(), reloadParent()]); };
  return <><RobiaCard style={s.stack}><LoadState {...r} retry={r.reload} />
    {r.data ? <><Text style={s.title}>{r.data.name}</Text><Text style={s.body}>{r.data.description}</Text>
      <Text style={s.body}>{r.data.enabled ? 'Active' : 'Désactivée'} · {r.data.requiresApproval ? 'Validation humaine requise' : 'Sans approbation préalable'}</Text>
      <Text style={s.body}>Déclenchement : {r.data.trigger.type === "manual" ? "À la demande" : r.data.trigger.type === "scheduled" ? "Horaire enregistré ; lancement automatique indisponible" : "Événement enregistré ; déclenchement automatique indisponible"}</Text>
      <Field label="Nouveau nom" value={name} onChangeText={setName} placeholder={r.data.name} />
      <AsyncButton label="Renommer" disabled={!name.trim()} action={async () => { await request(path, { method: 'PATCH', body: { name: name.trim() } }); await reload(); }} />
      <AsyncButton label={r.data.enabled ? 'Désactiver' : 'Activer'} confirm={r.data.enabled ? undefined : 'Activer cette automatisation selon son déclencheur configuré ?'} action={async () => { await request(path + '/enabled', { method: 'PATCH', body: { enabled: !r.data!.enabled } }); await reload(); }} />
      <AsyncButton label="Lancer maintenant" disabled={!r.data.enabled || r.data.steps.some(step => Object.values(step.input ?? {}).some(value => value.includes("{{event.")))} confirm="Lancer une nouvelle exécution de cette automatisation ?" action={async () => {
        const run = await request<Run>(path + '/run', { method: 'POST', timeoutMs: 180000 }); setRunId(run.id); await reload();
      }} />
    </> : null}
    <Text style={s.title}>Exécutions</Text><LoadState {...runs} retry={runs.reload} empty={!runs.data?.length} />
    {runs.data?.map(run => <AsyncButton key={run.id} label={new Date(run.createdAt).toLocaleString('fr-FR') + ' · ' + (statusLabels[run.status] ?? run.status)} action={async () => setRunId(run.id)} />)}
  </RobiaCard>{runId ? <RunDetail key={runId} id={runId} reloadParent={reload} /> : null}</>;
}
export default function AutomationsScreen() {
  const { request, organization } = useSession(); const { websites, selectedWebsiteId, latestAudit } = useRobiaData();
  const list = useResource<Automation[]>(organization ? '/ops/automations' : null);
  const [selected, setSelected] = useState<string | null>(null); const [name, setName] = useState(''); const [description, setDescription] = useState('');
  const [actionType, setActionType] = useState(ACTIONS[0].value); const [trigger, setTrigger] = useState('manual');
  const [schedule, setSchedule] = useState('weekly'); const [event, setEvent] = useState('audit.completed');
  const [siteId, setSiteId] = useState(selectedWebsiteId ?? ''); const [taskTitle, setTaskTitle] = useState('');
  const [approval, setApproval] = useState(true); const [steps, setSteps] = useState<Step[]>([]);
  return <RobiaScreen fixedHeader><RobiaHeader compact back title="Automatisations" />
    <RobiaCard style={s.stack}><Text style={s.title}>Créer une automatisation</Text>
      {!organization ? <AsyncButton label="Compléter mon organisation" action={async () => router.push("/settings")} /> : null}
      <Field label="Nom" value={name} onChangeText={setName} /><Field label="Description" value={description} onChangeText={setDescription} />
      <Choices value={trigger} onChange={setTrigger} options={[{ value: 'manual', label: 'À la demande' }, { value: 'scheduled', label: 'Planifiée' }, { value: 'event', label: 'Sur événement' }]} />
      {trigger !== 'manual' ? <Text style={s.body}>Cette configuration peut être enregistrée, mais les déclenchements automatiques ne sont pas encore disponibles. Utilisez le lancement à la demande pour les étapes sans événement.</Text> : null}
      {trigger === 'scheduled' ? <><Choices value={schedule} onChange={setSchedule} options={[{ value: 'daily', label: 'Chaque jour à 9 h' }, { value: 'weekly', label: 'Chaque lundi à 9 h' }, { value: 'monthly', label: 'Le 1er du mois à 9 h' }]} /><Text style={s.body}>L’horaire suit le fuseau du serveur.</Text></> : null}
      {trigger === 'event' ? <Choices value={event} onChange={setEvent} options={[{ value: 'audit.completed', label: 'Audit terminé' }, { value: 'integration.disconnected', label: 'Service déconnecté' }]} /> : null}
      <Text style={s.title}>Étapes</Text>
      {steps.map((step, i) => <AsyncButton key={i} label={(i + 1) + '. ' + ACTIONS.find(a => a.value === step.actionType)?.label + ' · Retirer'} action={async () => setSteps(current => current.filter((_, j) => i !== j))} />)}
      <Choices value={actionType} onChange={setActionType} options={ACTIONS} />
      {actionType === 'robia.audit.run_diagnostic' ? <Choices value={siteId} onChange={setSiteId} options={websites.map(site => ({ value: site.id, label: site.domain ?? site.url }))} /> : null}
      {actionType === 'robia.opportunities.regenerate' ? <Text style={s.body}>{trigger === 'event' && event === 'audit.completed' ? 'Utilise l’audit qui a déclenché l’événement.' : 'Utilise le dernier audit terminé du site sélectionné.'}</Text> : null}
      {actionType === 'robia.action_items.create_internal_task' ? <Field label="Intitulé de la tâche" value={taskTitle} onChangeText={setTaskTitle} /> : null}
      <AsyncButton label="Ajouter cette étape" disabled={steps.length >= 20} action={async () => {
        const input: Record<string, string> = {};
        if (actionType === 'robia.audit.run_diagnostic') { if (!siteId) throw new Error('Sélectionnez un site.'); input.websiteId = siteId; }
        if (actionType === 'robia.opportunities.regenerate') {
          if (trigger === 'event' && event === 'audit.completed') input.auditId = '{{event.auditId}}';
          else { if (latestAudit?.status !== 'completed') throw new Error('Un audit terminé est nécessaire.'); input.auditId = latestAudit.id; }
        }
        if (actionType === 'robia.action_items.create_internal_task') { if (!taskTitle.trim()) throw new Error('Renseignez le titre de la tâche.'); input.title = taskTitle.trim(); }
        setSteps(current => [...current, { actionType, input }]);
      }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={s.body}>Approbation avant exécution</Text><Switch accessibilityLabel="Approbation avant exécution" value={approval} onValueChange={setApproval} /></View>
      <Text style={s.body}>L’automatisation sera créée désactivée. Vous pourrez ensuite l’activer.</Text>
      <AsyncButton label="Créer l’automatisation" disabled={!organization || !name.trim() || !steps.length} action={async () => {
        const automation = await request<Automation>('/ops/automations', { method: 'POST', body: {
          name: name.trim(), description, enabled: false, requiresApproval: approval, steps,
          trigger: { type: trigger, ...(trigger === 'scheduled' ? { cronExpression: schedule === 'daily' ? '0 9 * * *' : schedule === 'monthly' ? '0 9 1 * *' : '0 9 * * 1' } : {}), ...(trigger === 'event' ? { eventType: event } : {}) },
        } }); setName(''); setSteps([]); setSelected(automation.id); await list.reload();
      }} />
    </RobiaCard><LoadState {...list} retry={list.reload} empty={!list.data?.length} />
    {list.data?.map(a => <AsyncButton key={a.id} label={a.name + (a.enabled ? ' · Active' : ' · Désactivée')} action={async () => setSelected(a.id)} />)}
    {selected ? <AutomationDetail key={selected} id={selected} reloadParent={list.reload} /> : null}
  </RobiaScreen>;
}
