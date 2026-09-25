import { useState } from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';
import { AsyncButton, Choices, Field, LoadState, apiStyles as s } from '@/components/api-ui';
import { RobiaCard } from '@/components/robia-ui';
import { NavCard, Status, dateLabel } from '@/components/workspace-ui';
import { useResource } from '@/src/api/use-resource';
import { useSession } from '@/src/auth/session';
import type { Program } from '@/src/api/odc';
export function ProgramsContent() {
  const { organization } = useSession(); const r = useResource<Program[]>(organization ? '/odc/programs' : null);
  const [filter, setFilter] = useState('all'); const [search, setSearch] = useState('');
  const visible = r.data?.filter(p => (filter === 'all' || p.status === filter) && (p.name + ' ' + (p.description ?? '')).toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  return <>
    {!organization ? <NavCard title="Compléter mon entreprise" description="Une organisation est nécessaire pour gérer les programmes." href="/settings" /> : null}
    <AsyncButton label="Créer un programme" disabled={!organization} action={async () => router.push('/program-new')} />
    <Field label="Rechercher un programme" value={search} onChangeText={setSearch} />
    <Choices value={filter} onChange={setFilter} options={[{ value: 'all', label: 'Tous' }, { value: 'open', label: 'Ouverts' }, { value: 'draft', label: 'Brouillons' }, { value: 'closed', label: 'Fermés' }]} />
    <LoadState {...r} retry={r.reload} empty={!visible?.length} />
    {visible?.map(p => <RobiaCard key={p.id} style={s.stack}><Text style={s.title}>{p.name}</Text><Status value={p.status} /><Text style={s.body}>{p.description || 'Programme de candidatures'}</Text>{p.closesAt ? <Text style={s.body}>Clôture indicative : {dateLabel(p.closesAt)}</Text> : null}<AsyncButton label="Ouvrir le programme" action={async () => router.push({ pathname: '/program', params: { id: p.id } })} /></RobiaCard>)}
  </>;
}
