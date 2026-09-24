import { useState } from 'react';
import { Text, View } from 'react-native';
import { AsyncButton, Choices, Field, LoadState, apiStyles as s } from '@/components/api-ui';
import { RobiaCard } from '@/components/robia-ui';
import { Toggle } from '@/components/workspace-ui';
import { ConditionEditor } from '@/components/condition-editor';
import { useRobiaData } from '@/src/api/data';
import { useResource } from '@/src/api/use-resource';
import { useSession } from '@/src/auth/session';
import { ACTIONS, EVENTS, normalizeCondition, validateEventInputs, type Automation, type Condition, type Step } from '@/src/api/automations';
import type { Program, Application } from '@/src/api/odc';
import type { Audit } from '@/src/api/types';
const TEMPLATE_FIELDS: Record<string, { key: string; label: string }[]> = {
  audit_completed: [],
  weekly_opportunities_summary: [{ key: 'organizationName', label: 'Nom de l’entreprise' }, { key: 'openOpportunityCount', label: 'Nombre d’opportunités annoncé' }],
  automation_failed: [{ key: 'automationName', label: 'Nom de l’automatisation concernée' }, { key: 'errorMessage', label: 'Message ? inclure' }],
  odc_candidate_invite: [{ key: 'applicantName', label: 'Nom du candidat mentionné' }, { key: 'programName', label: 'Programme mentionné' }],
};
export function AutomationEditor({ automation, onSaved }: { automation?: Automation; onSaved(a: Automation): Promise<unknown> }) {
  const { request, organization } = useSession(); const { websites, selectedWebsiteId } = useRobiaData();
  const [name,setName] = useState(automation?.name ?? ''); const [description,setDescription] = useState(automation?.description ?? '');
  const [trigger,setTrigger] = useState(automation?.trigger.type ?? 'manual'); const [event,setEvent] = useState(automation?.trigger.eventType ?? 'audit.completed');
  const [cron,setCron] = useState(automation?.trigger.cronExpression ?? '0 9 * * 1'); const [timezone,setTimezone] = useState(automation?.trigger.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC');
  const [scope,setScope] = useState(automation?.scope ?? 'ORGANIZATION'); const [approval,setApproval] = useState(automation?.requiresApproval ?? true);
  const [conditions,setConditions] = useState<Condition | null>(automation?.conditions ?? null);
  const [steps,setSteps] = useState<Step[]>(automation?.steps ?? []); const [action,setAction] = useState(ACTIONS[0].value); const [title,setTitle] = useState('');
  const [siteId,setSiteId] = useState(selectedWebsiteId ?? ''); const [auditId,setAuditId] = useState('');
  const [programId,setProgramId] = useState(''); const [applicationId,setApplicationId] = useState(''); const [useEvent,setUseEvent] = useState(true);
  const [template,setTemplate] = useState('audit_completed'); const [templateData,setTemplateData] = useState<Record<string,string>>({});
  const needsApplication = action.startsWith('robia.odc.'); const needsAudit = action === 'robia.opportunities.regenerate' || (action === 'robia.notification.send_email' && template === 'audit_completed');
  const eventInput = useEvent && trigger === 'event' && (needsApplication ? event.startsWith('odc.') : event === 'audit.completed');
  const programs = useResource<Program[]>(needsApplication && !eventInput ? '/odc/programs' : null);
  const applications = useResource<Application[]>(needsApplication && !eventInput && programId ? '/odc/programs/' + encodeURIComponent(programId) + '/applications' : null);
  const audits = useResource<Audit[]>(needsAudit && !eventInput && siteId ? '/audits?website_id=' + encodeURIComponent(siteId) : null);
  return <RobiaCard style={s.stack}><Text style={s.title}>{automation ? 'Modifier l’automatisation' : 'Créer une automatisation'}</Text>
    <Field label="Nom" value={name} onChangeText={setName} /><Field label="Description" value={description} onChangeText={setDescription} multiline />
    <Choices value={scope} onChange={setScope} options={[{ value: 'ORGANIZATION', label: 'Entreprise' }, { value: 'PROGRAM', label: 'Programme' }, { value: 'COHORT', label: 'Promotion' }, { value: 'ROBIA_INTERNAL', label: 'Interne' }]} />
    <Text style={s.body}>Cette catégorie sert au classement. Les conditions portent sur l’ensemble de votre entreprise.</Text>
    <Choices value={trigger} onChange={setTrigger} options={[{ value: 'manual', label: '? la demande' }, { value: 'scheduled', label: 'Planifiée' }, { value: 'event', label: 'Sur événement' }]} />
    {trigger === 'scheduled' ? <><Choices value={cron} onChange={setCron} options={[{ value: '0 9 * * *', label: 'Chaque jour ? 9 h' }, { value: '0 9 * * 1', label: 'Chaque lundi ? 9 h' }, { value: '0 9 1 * *', label: 'Le 1er du mois ? 9 h' }]} /><Field label="Horaire personnalisé (expression cron)" value={cron} onChangeText={setCron} autoCapitalize="none" /><Field label="Fuseau horaire" value={timezone} onChangeText={setTimezone} autoCapitalize="none" placeholder="Europe/Paris" /><Text style={s.body}>Les horaires s’appliquent dans le fuseau indiqué, lorsque l’automatisation est active.</Text></> : null}
    {trigger === 'event' ? <Choices value={event} onChange={setEvent} options={EVENTS} /> : null}
    <Toggle label="Ajouter des conditions" value={!!conditions} onChange={enabled => setConditions(enabled ? { field: 'opportunity.count', operator: 'gt', value: 0 } : null)} />
    {conditions ? <ConditionEditor value={conditions} onChange={setConditions} /> : null}
    <Text style={s.title}>étapes ? {steps.length}/20</Text>
    {steps.map((step,i) => <View key={i} style={s.stack}><Text style={s.body}>{i+1}. {ACTIONS.find(a => a.value === step.actionType)?.label ?? step.actionType}</Text>
      <Text style={s.body}>{step.input?.title ? String(step.input.title) : step.input?.applicationId ? 'Dossier sélectionné' : step.input?.auditId ? 'Audit sélectionné' : step.input?.websiteId ? websites.find(w => w.id === step.input?.websiteId)?.url : ''}</Text>
      <AsyncButton label="Monter cette étape" disabled={i === 0} action={async () => setSteps(current => { const next = [...current]; [next[i-1], next[i]] = [next[i], next[i-1]]; return next; })} /><AsyncButton label="Retirer cette étape" action={async () => setSteps(current => current.filter((_,j) => i !== j))} />
    </View>)}
    <Choices value={action} onChange={setAction} options={ACTIONS} />
    {action === 'robia.action_items.create_internal_task' ? <Field label="Titre de la tâche" value={title} onChangeText={setTitle} /> : null}
    {trigger === 'event' && (needsAudit || needsApplication) ? <Toggle label="Utiliser le dossier ou l’audit de l’événement" value={useEvent} onChange={setUseEvent} /> : null}
    {action === 'robia.audit.run_diagnostic' || (needsAudit && !eventInput) ? <><Text style={s.body}>Site concerné</Text><Choices value={siteId} onChange={v => { setSiteId(v); setAuditId(''); }} options={websites.map(w => ({ value: w.id, label: w.domain ?? w.url }))} /></> : null}
    {needsAudit && !eventInput ? <><LoadState {...audits} retry={audits.reload} /><Choices value={auditId} onChange={setAuditId} options={audits.data?.filter(a => a.status === 'completed').map(a => ({ value: a.id, label: new Date(a.createdAt).toLocaleString('fr-FR') })) ?? []} /></> : null}
    {needsApplication && !eventInput ? <><LoadState {...programs} retry={programs.reload} /><Choices value={programId} onChange={v => { setProgramId(v); setApplicationId(''); }} options={programs.data?.map(p => ({ value: p.id, label: p.name })) ?? []} /><LoadState {...applications} retry={applications.reload} /><Choices value={applicationId} onChange={setApplicationId} options={applications.data?.map(a => ({ value: a.id, label: a.applicant.displayName })) ?? []} /></> : null}
    {action === 'robia.notification.send_email' ? <><Text style={s.body}>Cet e-mail est adressé au créateur de l’automatisation. Les invitations aux candidats se gèrent dans le programme.</Text>
      <Choices value={template} onChange={v => { setTemplate(v); setTemplateData({}); }} options={[{ value: 'audit_completed', label: 'Audit terminé' }, { value: 'weekly_opportunities_summary', label: 'Bilan d’opportunités' }, { value: 'automation_failed', label: 'Signalement d’échec' }, { value: 'odc_candidate_invite', label: 'Copie d’invitation' }]} />
      {TEMPLATE_FIELDS[template].map(f => <Field key={f.key} label={f.label} value={templateData[f.key] ?? ''} onChangeText={value => setTemplateData({ ...templateData, [f.key]: value })} maxLength={200} />)}
      {template !== 'audit_completed' ? <Text style={s.body}>Les valeurs ci-dessus sont enregistrées telles quelles dans le modèle d’e-mail.</Text> : null}
    </> : null}
    <AsyncButton label="Ajouter cette étape" disabled={steps.length >= 20} action={async () => {
      const input: Record<string,unknown> = {};
      if (action === 'robia.audit.run_diagnostic') { if (!siteId) throw new Error('Choisissez un site.'); input.websiteId = siteId; }
      if (needsAudit) { if (!eventInput && !auditId) throw new Error('Choisissez un audit terminé.'); input.auditId = eventInput ? '{{event.auditId}}' : auditId; }
      if (needsApplication) { if (!eventInput && !applicationId) throw new Error('Choisissez un dossier.'); input.applicationId = eventInput ? '{{event.applicationId}}' : applicationId; }
      if (action === 'robia.action_items.create_internal_task') { if (!title.trim()) throw new Error('Renseignez le titre.'); input.title = title.trim(); }
      if (action === 'robia.notification.send_email') {
        const data: Record<string,string> = {};
        for (const f of TEMPLATE_FIELDS[template]) { const value = templateData[f.key]?.trim(); if (!value || value.length > 200 || /[\r\n]/.test(value)) throw new Error(f.label + ' : saisissez une valeur sur une ligne (200 caractères maximum).'); data[f.key] = value; }
        input.templateKey = template; input.templateData = data;
      }
      setSteps(current => [...current, { actionType: action, input }]);
    }} />
    <Toggle label="Approbation avant chaque exécution" value={approval} onChange={setApproval} />
    <Text style={s.body}>{automation ? 'L’enregistrement conserve l’état actif ou inactif de cette automatisation.' : 'L’automatisation sera créée désactivée. Vous pourrez vérifier ses étapes avant de l’activer.'}</Text>
    <AsyncButton label={automation ? 'Enregistrer les modifications' : 'Créer l’automatisation'} disabled={!organization || !name.trim() || !steps.length} confirm={automation?.enabled ? 'Appliquer cette configuration ? une automatisation active ?' : undefined} action={async () => {
      validateEventInputs(steps, trigger, event);
      if (trigger === 'scheduled') { try { new Intl.DateTimeFormat('fr-FR', { timeZone: timezone }).format(); } catch { throw new Error('Fuseau horaire invalide.'); } if (!cron.trim()) throw new Error('Renseignez un horaire.'); }
      const result = await request<Automation>('/ops/automations' + (automation ? '/' + encodeURIComponent(automation.id) : ''), { method: automation ? 'PATCH' : 'POST', body: { name: name.trim(), description, scope, requiresApproval: approval, steps, conditions: conditions ? normalizeCondition(conditions) : null, ...(!automation ? { enabled: false } : {}), trigger: { type: trigger, ...(trigger === 'event' ? { eventType: event } : {}), ...(trigger === 'scheduled' ? { cronExpression: cron.trim(), timezone: timezone.trim() } : {}) } } });
      await onSaved(result);
    }} />
  </RobiaCard>;
}
