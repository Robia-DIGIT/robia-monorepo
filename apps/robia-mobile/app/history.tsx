import { auditScore } from '@/src/api/presentation';
import { Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { RobiaCard, RobiaHeader, RobiaScreen } from '@/components/robia-ui';
import { LoadState, apiStyles as s } from '@/components/api-ui';
import { SiteSelector } from '@/components/site-selector';
import { useResource } from '@/src/api/use-resource';
import { useRobiaData } from '@/src/api/data';
import type { Audit } from '@/src/api/types';
export default function HistoryScreen() {
  const { selectedWebsiteId } = useRobiaData();
  const resource = useResource<Audit[]>(selectedWebsiteId ? '/audits?website_id=' + encodeURIComponent(selectedWebsiteId) : null);
  return <RobiaScreen fixedHeader refreshing={resource.loading} onRefresh={resource.reload}><RobiaHeader compact back title="Historique des audits" /><SiteSelector />
    <LoadState {...resource} retry={resource.reload} empty={!resource.data?.length} />
    {resource.data?.map(a => <Pressable key={a.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/audit-detail', params: { id: a.id } })}>
      <RobiaCard style={s.stack}><Text style={s.title}>{new Date(a.createdAt).toLocaleString('fr-FR')}</Text>
      <Text style={s.body}>{a.status === 'completed' ? 'Terminé' : a.status === 'failed' ? 'Échec' : 'En cours'} · {auditScore(a).label} : {auditScore(a).value ?? '—'}/100</Text></RobiaCard>
    </Pressable>)}
  </RobiaScreen>;
}
