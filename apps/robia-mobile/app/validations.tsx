import { Text } from 'react-native';
import { router } from 'expo-router';
import { AsyncButton, LoadState, apiStyles as s } from '@/components/api-ui';
import { RobiaCard, RobiaHeader, RobiaScreen } from '@/components/robia-ui';
import { useResource } from '@/src/api/use-resource';
type Validation = { id: string; documentId: string; status: string; actionType: string; createdAt: string };
export default function ValidationsScreen() {
  const r = useResource<Validation[]>('/validations');
  return <RobiaScreen fixedHeader><RobiaHeader compact back title="Historique des validations" /><LoadState {...r} retry={r.reload} empty={!r.data?.length} />
    {r.data?.map(v => <RobiaCard key={v.id} style={s.stack}><Text style={s.title}>{v.status === 'approved' ? 'Approuvé' : 'Rejeté'}</Text>
      <Text style={s.body}>{new Date(v.createdAt).toLocaleString('fr-FR')} · {{ publish: 'Publication', update: 'Mise à jour', reply: 'Réponse' }[v.actionType] ?? v.actionType}</Text>
      <AsyncButton label="Voir le document" action={async () => router.push({ pathname: '/document', params: { id: v.documentId } })} /></RobiaCard>)}
  </RobiaScreen>;
}
