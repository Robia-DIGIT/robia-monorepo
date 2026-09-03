import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  IconBadge,
  PrimaryButton,
  RobiaCard,
  RobiaHeader,
  RobiaScreen,
  SectionTitle,
  robiaStyles,
} from '@/components/robia-ui';
import { Brand, Fonts } from '@/constants/theme';
import { MOCK_ESTABLISHMENT } from '@/src/data/mock';

export default function HomeScreen() {
  return (
    <RobiaScreen>
      <RobiaHeader
        eyebrow="TABLEAU DE BORD"
        title={`Bonjour, ${MOCK_ESTABLISHMENT.name}`}
        subtitle={`${MOCK_ESTABLISHMENT.city} · Voici les priorités détectées par votre copilote.`}
        action={
          <Pressable accessibilityRole="button" accessibilityLabel="Notifications" style={styles.headerAction}>
            <MaterialIcons name="notifications-none" size={21} color={Brand.navyDark} />
            <View style={styles.notificationDot} />
          </Pressable>
        }
      />

      <RobiaCard style={styles.scoreCard} accent={Brand.teal}>
        <View style={styles.scoreTop}>
          <View>
            <Text style={styles.scoreLabel}>Score d`impact local</Text>
            <View style={styles.scoreLine}>
              <Text style={styles.score}>{MOCK_ESTABLISHMENT.impactScore}</Text>
              <Text style={styles.scoreTotal}>/100</Text>
            </View>
          </View>
          <View style={styles.scoreBadge}>
            <MaterialIcons name="auto-graph" size={28} color={Brand.tealDark} />
          </View>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${MOCK_ESTABLISHMENT.impactScore}%` }]} />
        </View>
        <Text style={robiaStyles.body}>Votre visibilité progresse. Trois actions prioritaires peuvent encore accélérer les résultats.</Text>
      </RobiaCard>

      <View style={styles.metrics}>
        <Metric icon="track-changes" value={MOCK_ESTABLISHMENT.opportunitiesCount} label="Opportunités" />
        <Metric icon="description" value={MOCK_ESTABLISHMENT.documentsReadyCount} label="Documents prêts" />
        <Metric icon="calendar-month" value={`${MOCK_ESTABLISHMENT.planProgressPercent}%`} label="Plan 30 jours" />
      </View>

      <PrimaryButton label="Lancer un nouvel audit" icon="radar" onPress={() => router.push('/audit')} />

      <SectionTitle title="À faire maintenant" />
      <RobiaCard style={styles.actionCard}>
        <IconBadge name="storefront" />
        <View style={styles.actionCopy}>
          <Text style={robiaStyles.cardTitle}>Compléter votre fiche locale</Text>
          <Text style={robiaStyles.body}>Ajoutez vos horaires et vos dernières photos.</Text>
        </View>
        <MaterialIcons name="chevron-right" size={22} color={Brand.slate400} />
      </RobiaCard>
    </RobiaScreen>
  );
}

function Metric({ icon, value, label }: { icon: React.ComponentProps<typeof MaterialIcons>['name']; value: string | number; label: string }) {
  return (
    <View style={styles.metric}>
      <MaterialIcons name={icon} size={19} color={Brand.tealDark} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerAction: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.white },
  notificationDot: { position: 'absolute', width: 7, height: 7, borderRadius: 4, right: 10, top: 9, backgroundColor: Brand.orange },
  scoreCard: { gap: 15 },
  scoreTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoreLabel: { color: Brand.slate500, fontFamily: Fonts?.sans, fontSize: 13, fontWeight: '700' },
  scoreLine: { flexDirection: 'row', alignItems: 'baseline', marginTop: 3 },
  score: { color: Brand.navyDark, fontFamily: Fonts?.rounded, fontSize: 44, fontWeight: '900', letterSpacing: -1.5 },
  scoreTotal: { color: Brand.slate400, fontFamily: Fonts?.sans, fontSize: 15, fontWeight: '700' },
  scoreBadge: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.tealLight },
  track: { height: 8, borderRadius: 99, overflow: 'hidden', backgroundColor: Brand.slate100 },
  fill: { height: '100%', borderRadius: 99, backgroundColor: Brand.teal },
  metrics: { flexDirection: 'row', gap: 10 },
  metric: { flex: 1, minHeight: 112, padding: 12, borderRadius: 20, justifyContent: 'space-between', backgroundColor: Brand.white, borderWidth: 1, borderColor: Brand.slate200 },
  metricValue: { color: Brand.navyDark, fontFamily: Fonts?.rounded, fontSize: 23, fontWeight: '900' },
  metricLabel: { color: Brand.slate500, fontFamily: Fonts?.sans, fontSize: 11, lineHeight: 15, fontWeight: '600' },
  actionCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionCopy: { flex: 1, gap: 3 },
});
