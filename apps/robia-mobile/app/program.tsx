import { useState } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AsyncButton, Choices, Field, LoadState, apiStyles as s } from '@/components/api-ui';
import { RobiaCard, RobiaHeader, RobiaScreen } from '@/components/robia-ui';
import { ProgramEditor } from '@/components/program-editor';
import { Metric, Status, Toggle, dateLabel } from '@/components/workspace-ui';
import { useResource } from '@/src/api/use-resource';
import { useSession } from '@/src/auth/session';
import { canDecide, type Program, type Application, type Applicant, type Outreach } from '@/src/api/odc';
function NewApplication({ program, applications, reload }: { program: Program; applications: Application[]; reload(): Promise<unknown> }) {
  const { request } = useSession(); const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [phone, setPhone] = useState('');
  const [applicant, setApplicant] = useState<Applicant | null>(null);
  const otherPrograms = useResource<Program[]>('/odc/programs');
  const [source, setSource] = useState(''); const [reuse, setReuse] = useState('');
  const candidates = useResource<Application[]>(source ? '/odc/programs/' + encodeURIComponent(source) + '/applications' : null);
  return <RobiaCard style={s.stack}><Text style={s.title}>Nouveau dossier</Text>
    <Choices value={source ? 'existing' : 'new'} onChange={v => { setSource(v === 'new' ? '' : otherPrograms.data?.find(p => p.id !== program.id)?.id ?? ''); setReuse(''); }} options={[{ value: 'new', label: 'Nouveau candidat' }, { value: 'existing', label: 'Candidat d’un autre programme' }]} />
    {source ? <><LoadState {...otherPrograms} retry={otherPrograms.reload} /><Choices value={source} onChange={v => { setSource(v); setReuse(''); }} options={otherPrograms.data?.filter(p => p.id !== program.id).map(p => ({ value: p.id, label: p.name })) ?? []} /><LoadState {...candidates} retry={candidates.reload} /><Choices value={reuse} onChange={setReuse} options={candidates.data?.filter(a => !applications.some(existing => existing.applicantId === a.applicantId)).map(a => ({ value: a.applicantId, label: a.applicant.displayName })) ?? []} /></> : <>
      <Field label="Nom du candidat" value={name} onChangeText={setName} editable={!applicant} /><Field label="E-mail (pour les invitations)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" editable={!applicant} /><Field label="Téléphone (facultatif)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" editable={!applicant} />
    </>}
    <AsyncButton label="Créer le dossier" disabled={source ? !reuse : !name.trim()} action={async () => {
      let applicantId = reuse;
      if (!source) {
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw new Error('Saisissez une adresse e-mail valide.');
        const candidate = applicant ?? await request<Applicant>('/odc/applicants', { method: 'POST', body: { displayName: name.trim(), email: email.trim() || undefined, phone: phone.trim() || undefined } }); setApplicant(candidate); applicantId = candidate.id;
      }
      const result = await request<Application>('/odc/programs/' + encodeURIComponent(program.id) + '/applications', { method: 'POST', body: { applicantId } });
      await reload(); router.push({ pathname: '/application', params: { id: result.id } });
    }} />
    {applicant ? <Text style={s.body}>Le candidat est enregistré. En cas d?erreur, vous pouvez réessayer la cr?ation du dossier sans le recr?er.</Text> : null}
  </RobiaCard>;
}
function OutreachQueue({ program, applications }: { program: Program; applications: Application[] }) {
  const { request } = useSession(); const path = '/odc/programs/' + encodeURIComponent(program.id) + '/outreach'; const r = useResource<Outreach[]>(path);
  const [selection, setSelection] = useState<string[]>([]);
  const eligible = applications.filter(a => canDecide(a.status) && a.applicant.email && !r.data?.some(o => o.applicationId === a.id));
  return <View style={s.stack}><RobiaCard style={s.stack}><Text style={s.title}>Préparer les invitations</Text><Text style={s.body}>Sélectionnez les candidats dans l?ordre souhait?. Chaque e-mail sera ensuite envoyé avec votre confirmation.</Text>
    {eligible.map(a => <Toggle key={a.id} label={a.applicant.displayName + (selection.includes(a.id) ? ' ? position ' + (selection.indexOf(a.id) + 1) : '')} value={selection.includes(a.id)} onChange={checked => setSelection(current => checked ? [...current, a.id] : current.filter(id => id !== a.id))} />)}
    {!eligible.length ? <Text style={s.body}>Les dossiers ? examiner ou en liste d’attente, avec une adresse e-mail, peuvent être invit?s.</Text> : null}
    <AsyncButton label={'Pr?parer ' + selection.length + ' invitation(s)'} disabled={!selection.length || selection.length > 50 || r.loading || !!r.error} action={async () => { await request(path, { method: 'POST', body: { applicationIds: selection } }); setSelection([]); await r.reload(); }} />
  </RobiaCard><LoadState {...r} retry={r.reload} empty={!r.data?.length} />
    {r.data?.map(o => <RobiaCard key={o.id} style={s.stack}><Text style={s.title}>{o.sortOrder}. {o.applicantName}</Text><Status value={o.status} /><Text style={s.body}>{o.recipientMasked}</Text>{o.lastError ? <Text style={s.body}>{o.lastError}</Text> : null}{o.sentAt ? <Text style={s.body}>{dateLabel(o.sentAt)}</Text> : null}
      {o.isNext ? <><Text style={s.body}>Objet : Candidature ? {program.name} ? ? prochaine étape. L?e-mail invite cette personne ? poursuivre sa candidature.</Text><AsyncButton label="Envoyer cette invitation" confirm={'Envoyer l’invitation ? ' + o.applicantName + ' (' + o.recipientMasked + ') ?'} action={async () => { try { await request('/odc/outreach/' + encodeURIComponent(o.id) + '/send', { method: 'POST' }); } finally { await r.reload(); } }} /></> : null}
      {['queued','failed'].includes(o.status) ? <AsyncButton label="Passer cette invitation" confirm="Retirer cette invitation de la s?quence d’envoi ?" action={async () => { await request('/odc/outreach/' + encodeURIComponent(o.id) + '/skip', { method: 'POST' }); await r.reload(); }} /> : null}
    </RobiaCard>)}
  </View>;
}
export default function ProgramScreen() {
  const params = useLocalSearchParams<{ id?: string }>(); const id = typeof params.id === 'string' ? params.id : '';
  const { request } = useSession(); const path = id ? '/odc/programs/' + encodeURIComponent(id) : null;
  const r = useResource<Program>(path); const list = useResource<Application[]>(path ? path + '/applications' : null);
  const [section, setSection] = useState('applications'); const [filter, setFilter] = useState('all'); const [search, setSearch] = useState('');
  const reload = async () => { await Promise.all([r.reload(), list.reload()]); };
  const visible = list.data?.filter(a => (filter === 'all' || a.status === filter) && (a.applicant.displayName + ' ' + (a.applicant.email ?? '')).toLowerCase().includes(search.toLowerCase()));
  return <RobiaScreen fixedHeader><RobiaHeader compact back title={r.data?.name ?? 'Programme'} /><LoadState {...r} retry={r.reload} />
    {r.data ? <><RobiaCard style={s.stack}><Status value={r.data.status} /><Text style={s.body}>{r.data.description}</Text><Metric label="Dossiers" value={list.data?.length} /><Choices value={section} onChange={setSection} options={[{ value: 'applications', label: 'Dossiers' }, { value: 'new', label: 'Ajouter' }, { value: 'outreach', label: 'Invitations' }, { value: 'settings', label: 'Programme' }]} /></RobiaCard>
      {section === 'applications' ? <><Field label="Rechercher un candidat" value={search} onChangeText={setSearch} /><Choices value={filter} onChange={setFilter} options={[{ value: 'all', label: 'Tous' }, { value: 'in_review', label: '? examiner' }, { value: 'incomplete', label: '? compl?ter' }, { value: 'waitlisted', label: 'Liste d?attente' }, { value: 'accepted', label: 'Accept?s' }, { value: 'rejected', label: 'Refus?s' }]} /><Text style={s.body}>Class?s par score final, puis par date.</Text><LoadState {...list} retry={list.reload} empty={!visible?.length} />
        {visible?.map(a => <RobiaCard key={a.id} style={s.stack}><Text style={s.title}>{a.applicant.displayName}</Text><Status value={a.status} /><Metric label="Score final" value={a.finalTotal} /><AsyncButton label="Examiner le dossier" action={async () => router.push({ pathname: '/application', params: { id: a.id } })} /></RobiaCard>)}
      </> : null}
      {section === 'new' ? r.data.status === 'open' ? <NewApplication program={r.data} applications={list.data ?? []} reload={list.reload} /> : <Text style={s.body}>Ouvrez le programme pour ajouter des dossiers.</Text> : null}
      {section === 'outreach' ? <><LoadState {...list} retry={list.reload} /><OutreachQueue program={r.data} applications={list.data ?? []} /></> : null}
      {section === 'settings' ? <><RobiaCard style={s.stack}>
        {['draft','closed'].includes(r.data.status) ? <AsyncButton label="Ouvrir le programme" confirm="Accepter de nouvelles candidatures pour ce programme ?" action={async () => { await request(path + '/open', { method: 'POST' }); await reload(); }} /> : null}
        {r.data.status === 'open' ? <AsyncButton label="Fermer le programme" confirm="Fermer le programme aux nouveaux dossiers ?" action={async () => { await request(path + '/close', { method: 'POST' }); await reload(); }} /> : null}
      </RobiaCard><LoadState {...list} retry={list.reload} />{!list.loading && !list.error && r.data.status !== 'archived' ? <ProgramEditor key={r.data.id} program={r.data} definitionLocked={!!list.data?.length} onSaved={async () => { await reload(); setSection('applications'); }} /> : null}</> : null}
    </> : null}
  </RobiaScreen>;
}
