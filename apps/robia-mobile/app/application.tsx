import { useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { AsyncButton, Choices, Field, LoadState, apiStyles as s } from '@/components/api-ui';
import { RobiaCard, RobiaHeader, RobiaScreen } from '@/components/robia-ui';
import { Metric, Status, dateLabel, statusLabel } from '@/components/workspace-ui';
import { useResource } from '@/src/api/use-resource';
import { useSession } from '@/src/auth/session';
import { downloadApplicationDocument, uploadApplicationDocument } from '@/src/api/attachments';
import { answersPayload, canDecide, canEditAnswers, canUpload, integer, missingLabels, terminal, type Application, type Criterion, type HistoryEvent, type ScoreLine } from '@/src/api/odc';
function ScoreEditor({ criterion, line, application, reload }: { criterion: Criterion; line?: ScoreLine; application: Application; reload(): Promise<unknown> }) {
  const { request } = useSession(); const [proposed, setProposed] = useState(line?.proposedPoints == null ? '' : String(line.proposedPoints)); const [final, setFinal] = useState(line?.finalPoints == null ? '' : String(line.finalPoints)); const [rationale, setRationale] = useState(line?.rationale ?? '');
  const path = '/odc/applications/' + encodeURIComponent(application.id);
  return <RobiaCard style={s.stack}><Text style={s.title}>{criterion.label}</Text><Text style={s.body}>{criterion.description} ? /{criterion.maxPoints} ? coefficient {criterion.weight}{criterion.required ? ' ? obligatoire' : ''}</Text>
    <Metric label="Proposition enregistrée" value={line?.proposedPoints} /><Metric label="Note finale enregistrée" value={line?.finalPoints} />
    {line?.rationale ? <Text style={s.body}>{line.rationale}</Text> : null}
    {!terminal(application.status) ? <><Field label="Note proposée" value={proposed} onChangeText={setProposed} keyboardType="number-pad" /><Field label="Justification de la proposition" value={rationale} onChangeText={setRationale} multiline /><AsyncButton label="Enregistrer la proposition" disabled={!proposed.trim()} action={async () => { await request(path + '/propose-scores', { method: 'POST', body: { scores: [{ criterionId: criterion.id, proposedPoints: integer(proposed, criterion.label, 0, criterion.maxPoints), rationale: rationale.trim(), proposedBy: 'reviewer' }] } }); await reload(); }} />
      <Field label="Note finale" value={final} onChangeText={setFinal} keyboardType="number-pad" /><AsyncButton label="Valider cette note" disabled={!final.trim()} action={async () => { await request(path + '/scores', { method: 'PATCH', body: { scores: [{ criterionId: criterion.id, finalPoints: integer(final, criterion.label, 0, criterion.maxPoints) }] } }); await reload(); }} />
    </> : null}
  </RobiaCard>;
}
function ApplicationBody({ application: a, reload }: { application: Application; reload(): Promise<unknown> }) {
  const { request } = useSession(); const path = '/odc/applications/' + encodeURIComponent(a.id);
  const [section, setSection] = useState('answers');
  const [answers, setAnswers] = useState<Record<string,string>>(() => Object.fromEntries(a.program.fields.map(f => [f.key, a.answers[f.key] == null ? '' : String(a.answers[f.key])])));
  const [summary, setSummary] = useState(a.summaryDraft ?? ''); const [decision, setDecision] = useState('waitlisted'); const [reason, setReason] = useState(''); const [withdrawReason, setWithdrawReason] = useState('');
  const history = useResource<HistoryEvent[]>(section === 'history' ? path + '/history' : null);
  async function task(actionType: string) {
    // These three server actions only prepare or check this dossier.
    // A manual automation is the backend's supported execution path.
    type Automation = { id: string; name: string; enabled: boolean; requiresApproval: boolean; trigger: { type: string }; steps: { actionType: string; input: Record<string,unknown> }[] };
    const name = 'Dossier ? ' + a.applicant.displayName + ' ? ' + actionType.split('.').at(-1);
    const automations = await request<Automation[]>('/ops/automations');
    let automation = automations.find(item => item.enabled && !item.requiresApproval && item.trigger.type === 'manual' && item.steps.length === 1 && item.steps[0].actionType === actionType && item.steps[0].input.applicationId === a.id);
    if (!automation) automation = await request<Automation>('/ops/automations', { method: 'POST', body: { name, description: 'Action ? la demande depuis le dossier de candidature.', enabled: true, requiresApproval: false, trigger: { type: 'manual' }, steps: [{ actionType, input: { applicationId: a.id } }] } });
    const run = await request<{ status: string; errorMessage?: string }>('/ops/automations/' + encodeURIComponent(automation.id) + '/run', { method: 'POST', timeoutMs: 90000 });
    await reload(); if (run.status !== 'succeeded') throw new Error(run.errorMessage || 'Ex?cution ' + statusLabel(run.status) + '. Consultez les automatisations.');
    if (actionType === 'robia.odc.prepare_application_summary') { const fresh = await request<Application>(path); setSummary(fresh.summaryDraft ?? ''); }
  }
  return <>
    <RobiaCard style={s.stack}><Text style={s.title}>{a.applicant.displayName}</Text><Text style={s.body}>{a.program.name}</Text><Status value={a.status} /><Text selectable style={s.body}>{[a.applicant.email,a.applicant.phone].filter(Boolean).join(' ? ')}</Text>
      <Metric label="Score propos?" value={a.proposedTotal} /><Metric label="Score final" value={a.finalTotal} />
      {missingLabels(a).length ? <Text style={s.body}>? compléter : {missingLabels(a).join(', ')}</Text> : null}
      {a.decisionReason ? <Text style={s.body}>Motif de la décision : {a.decisionReason}</Text> : null}
      <Choices value={section} onChange={setSection} options={[{ value: 'answers', label: 'Dossier' }, { value: 'documents', label: 'Pi?ces' }, { value: 'review', label: '?valuation' }, { value: 'decision', label: 'D?cision' }, { value: 'history', label: 'Historique' }]} />
    </RobiaCard>
    {section === 'answers' ? <RobiaCard style={s.stack}>
      {a.program.fields.map(f => <View key={f.key} style={s.stack}>{f.fieldType === 'select' && canEditAnswers(a.status) ? <><Text style={s.body}>{f.label}{f.required ? ' *' : ''}</Text><Choices value={answers[f.key] ?? ''} onChange={v => setAnswers({ ...answers, [f.key]: v })} options={[{ value: '', label: 'Non renseign?' }, ...(Array.isArray(f.options) ? f.options.filter((v): v is string => typeof v === 'string').map(v => ({ value: v, label: v })) : [])]} /></> : <Field label={f.label + (f.required ? ' *' : '') + (f.fieldType === 'date' ? ' (AAAA-MM-JJ)' : '')} value={answers[f.key] ?? ''} onChangeText={v => setAnswers({ ...answers, [f.key]: v })} editable={canEditAnswers(a.status)} multiline={f.fieldType === 'longtext'} keyboardType={f.fieldType === 'number' ? 'decimal-pad' : 'default'} />}</View>)}
      {!a.program.fields.length ? <Text style={s.body}>Ce programme ne demande pas de réponse compl?mentaire.</Text> : null}
      {canEditAnswers(a.status) ? <AsyncButton label="Enregistrer les r?ponses" onSuccess="Réponses enregistrées." action={async () => { await request(path, { method: 'PATCH', body: answersPayload(a.program.fields, answers) }); await reload(); }} /> : null}
      {a.status === 'draft' ? <AsyncButton label="Soumettre le dossier" confirm="Enregistrer les r?ponses et soumettre le dossier ? v?rification ?" action={async () => { await request(path, { method: 'PATCH', body: answersPayload(a.program.fields, answers) }); await request(path + '/submit', { method: 'POST' }); await reload(); }} /> : null}
      {a.status === 'incomplete' ? <AsyncButton label="Enregistrer et revérifier le dossier" action={async () => { await request(path, { method: 'PATCH', body: answersPayload(a.program.fields, answers) }); await task('robia.odc.flag_missing_documents'); }} /> : null}
    </RobiaCard> : null}
    {section === 'documents' ? <><Text style={s.body}>Chaque pièce peut contenir un fichier de 10 Mo maximum.</Text>{!a.program.docTypes.length ? <Text style={s.body}>Aucune pièce demandée pour ce programme.</Text> : null}
      {a.program.docTypes.map(d => { const file = a.documents.find(item => item.documentTypeId === d.id); return <RobiaCard key={d.id} style={s.stack}><Text style={s.title}>{d.label}{d.required ? ' ? obligatoire' : ''}</Text><Text style={s.body}>{file?.originalName ?? 'Aucun fichier joint'}</Text>{file ? <><Status value={file.status} /><Text style={s.body}>{(file.sizeBytes / 1024).toFixed(0)} Ko</Text></> : null}
        {file?.status === 'received' ? <AsyncButton label="Ouvrir ou partager le fichier" action={() => downloadApplicationDocument(request, file)} /> : null}
        {canUpload(a.status) ? <AsyncButton label={file?.status === 'received' ? 'Remplacer le fichier' : 'Joindre un fichier'} confirm={file?.status === 'received' ? 'Le nouveau fichier remplacera la pièce actuelle après son transfert.' : undefined} action={async () => { if (await uploadApplicationDocument(request, a.id, d)) await reload(); }} /> : null}
      </RobiaCard>; })}
      {a.status === 'incomplete' ? <AsyncButton label="Revérifier les pièces reçues" action={() => task('robia.odc.flag_missing_documents')} /> : null}
    </> : null}
    {section === 'review' ? <><RobiaCard style={s.stack}><Text style={s.title}>Synthèse du dossier</Text><Field label="Synthèse de travail" value={summary} onChangeText={setSummary} multiline editable={!terminal(a.status)} />
      {!terminal(a.status) ? <><AsyncButton label="Enregistrer la synthèse" disabled={!summary.trim()} action={async () => { await request(path + '/propose-summary', { method: 'POST', body: { summaryDraft: summary.trim() } }); await reload(); }} /><AsyncButton label="Préparer un résumé de complétude" confirm={summary ? 'Remplacer la synthèse par un résumé des champs et pièces reçus ?' : undefined} action={() => task('robia.odc.prepare_application_summary')} /><AsyncButton label="Créer une tâche de revue" onSuccess="Tâche ajout?e au plan d’action." action={() => task('robia.odc.create_review_task')} /></> : null}
    </RobiaCard>{a.program.criteria.map(c => <ScoreEditor key={c.id} criterion={c} line={a.scoreLines.find(l => l.criterionId === c.id)} application={a} reload={reload} />)}</> : null}
    {section === 'decision' ? <RobiaCard style={s.stack}>
      {canDecide(a.status) ? <><Text style={s.title}>Décision humaine</Text>{a.program.requireDualReview ? <Text style={s.body}>Ce programme demande une double revue. V?rifiez avec votre ?quipe qu?elle a été effectu?e.</Text> : null}
        {a.program.decisionThreshold != null ? <Metric label="Seuil indicatif" value={a.program.decisionThreshold} /> : null}
        <Choices value={decision} onChange={setDecision} options={[{ value: 'accepted', label: 'Accepter' }, { value: 'waitlisted', label: 'Liste d?attente' }, { value: 'rejected', label: 'Refuser' }]} />
        <Field label="Motif de la décision (obligatoire)" value={reason} onChangeText={setReason} multiline />
        <AsyncButton label="Enregistrer cette décision" disabled={!reason.trim()} confirm={'Confirmer ? ' + statusLabel(decision) + ' ? pour ' + a.applicant.displayName + ' ?\n' + reason.trim()} action={async () => { await request(path + '/decide', { method: 'POST', body: { decision, decisionReason: reason.trim() } }); setReason(''); await reload(); }} />
      </> : <Text style={s.body}>{terminal(a.status) ? 'La décision est enregistrée. Ce dossier est désormais en lecture seule.' : 'Le dossier doit être complet et ? examiner avant une décision.'}</Text>}
      {!terminal(a.status) ? <><Field label="Motif du retrait" value={withdrawReason} onChangeText={setWithdrawReason} multiline /><AsyncButton label="Retirer la candidature" disabled={!withdrawReason.trim()} confirm={'Retirer définitivement le dossier de ' + a.applicant.displayName + ' ?'} action={async () => { await request(path + '/withdraw', { method: 'POST', body: { reason: withdrawReason.trim() } }); await reload(); }} /></> : null}
    </RobiaCard> : null}
    {section === 'history' ? <><LoadState {...history} retry={history.reload} empty={!history.data?.length} />{history.data?.map(e => <RobiaCard key={e.id} style={s.stack}><Text style={s.title}>{{ submitted: 'Dossier soumis', screening_started: 'V?rification commenc?e', screening_passed: 'Dossier complet', screening_failed: 'Dossier incomplet', decided: 'D?cision enregistr?e', withdrawn: 'Candidature retir?e', 'odc.outreach.queued': 'Invitation pr?par?e', 'odc.outreach.sent': 'Invitation envoy?e', 'odc.outreach.skipped': 'Invitation pass?e' }[e.eventType] ?? e.eventType}</Text><Text style={s.body}>{dateLabel(e.createdAt)} ? {e.actorUserId ? 'Intervention humaine' : 'V?rification automatique'}</Text>{e.toStatus ? <Status value={e.toStatus} /> : null}{e.payload?.reason || e.payload?.decisionReason ? <Text style={s.body}>{e.payload.reason ?? e.payload.decisionReason}</Text> : null}</RobiaCard>)}</> : null}
  </>;
}
export default function ApplicationScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const r = useResource<Application>(typeof id === 'string' ? '/odc/applications/' + encodeURIComponent(id) : null);
  return <RobiaScreen fixedHeader><RobiaHeader compact back title="Dossier de candidature" /><LoadState {...r} retry={r.reload} />{r.data ? <ApplicationBody key={r.data.id} application={r.data} reload={r.reload} /> : null}</RobiaScreen>;
}
