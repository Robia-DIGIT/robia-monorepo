import { auditScore } from '@/src/api/presentation';
import { router } from 'expo-router';
import { Text } from 'react-native';
import { RobiaCard, RobiaHeader, RobiaScreen } from '@/components/robia-ui';
import { AsyncButton, apiStyles as s } from '@/components/api-ui';
import { useRobiaData } from '@/src/api/data';
export default function ChatScreen() {
  const { latestAudit, opportunities, actions } = useRobiaData();
  return <RobiaScreen fixedHeader><RobiaHeader compact back title="Mon copilote" />
    <RobiaCard style={s.stack}><Text style={s.title}>Votre situation</Text>
      <Text style={s.body}>{auditScore(latestAudit).label} : {auditScore(latestAudit).value ?? '—'} / 100</Text>
      <Text style={s.body}>{opportunities.length} priorités · {actions.filter(a => a.status === 'done').length} actions terminées</Text>
      <Text style={s.body}>Retrouvez vos recommandations et lancez les prochaines étapes.</Text>
      <AsyncButton label="Voir mes priorités" action={async () => router.push('/(tabs)/opportunities')} />
      <AsyncButton label="Lancer un diagnostic" action={async () => router.push('/audit')} />
      <AsyncButton label="Contacter l’équipe" action={async () => router.push('/support')} />
    </RobiaCard>
  </RobiaScreen>;
}
