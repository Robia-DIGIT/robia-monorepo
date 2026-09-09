import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type DimensionValue } from 'react-native';

import { RobiaCard, RobiaScreen } from '@/components/robia-ui';
import { Brand, Fonts } from '@/constants/theme';
import { useRobiaData } from '@/src/api/data';
import { useSession } from '@/src/auth/session';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

export default function HomeScreen() {
  const { user, organization } = useSession();
  const { latestAudit, opportunities, documents, actions, isLoading, error, refresh } = useRobiaData();
  const score = latestAudit?.globalScore ?? 0;
  const done = actions.filter((item) => item.status === 'done').length;
  const progress = actions.length ? Math.round((done / actions.length) * 100) : 0;
  const firstName = user?.name?.split(' ')[0] ?? organization?.name ?? 'Entreprise';

  return (
    <RobiaScreen fixedHeader>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour, {firstName}</Text>
          <Text style={styles.context}>{organization?.city ?? 'Votre espace'} · Votre visibilité aujourd’hui</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Actualiser" onPress={() => void refresh()} style={styles.roundButton}>
          {isLoading ? <ActivityIndicator size="small" color={Brand.tealDark} /> : <MaterialIcons name="notifications-none" size={22} color={Brand.navyDark} />}
          {!isLoading && opportunities.length > 0 ? <View style={styles.notificationDot} /> : null}
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <RobiaCard style={styles.balanceCard}>
        <View style={styles.cardHeading}>
          <View>
            <Text style={styles.balanceLabel}>Score de visibilité</Text>
            <View style={styles.scoreRow}>
              <Text style={styles.score}>{score}</Text>
              <Text style={styles.scoreSuffix}>/100</Text>
            </View>
          </View>
          <View style={styles.trend}>
            <MaterialIcons name="trending-up" size={15} color={Brand.tealDark} />
            <Text style={styles.trendText}>Diagnostic</Text>
          </View>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: (Math.max(0, Math.min(score, 100)) + '%') as DimensionValue }]} />
        </View>
        <Pressable accessibilityRole="button" onPress={() => router.push('/audit')} style={({ pressed }) => [styles.auditButton, pressed && styles.pressed]}>
          <Text style={styles.auditButtonText}>{latestAudit ? 'Relancer mon audit' : 'Lancer mon premier audit'}</Text>
          <MaterialIcons name="arrow-forward" size={18} color={Brand.white} />
        </Pressable>
      </RobiaCard>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Votre activité</Text>
        <Text style={styles.sectionAction}>Vue d’ensemble</Text>
      </View>
      <View style={styles.metrics}>
        <Metric icon="track-changes" value={opportunities.length} label="Opportunités" color={Brand.orange} tint={Brand.orangeLight} />
        <Metric icon="description" value={documents.length} label="Documents" color={Brand.electric} tint={Brand.electricLight} />
        <Metric icon="checklist" value={progress + '%'} label="Plan réalisé" color={Brand.tealDark} tint={Brand.tealLight} />
      </View>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Priorités</Text>
        <Pressable onPress={() => router.navigate('/(tabs)/opportunities')}><Text style={styles.seeAll}>Tout voir</Text></Pressable>
      </View>
      <RobiaCard style={styles.listCard}>
        {opportunities.length ? opportunities.slice(0, 3).map((item, index) => (
          <Pressable
            key={item.id}
            onPress={() => router.navigate('/(tabs)/opportunities')}
            style={({ pressed }) => [styles.priorityRow, index > 0 && styles.rowBorder, pressed && styles.pressed]}>
            <View style={[styles.priorityIcon, { backgroundColor: index === 0 ? Brand.orangeLight : Brand.tealLight }]}>
              <MaterialIcons name={index === 0 ? 'bolt' : 'auto-awesome'} size={19} color={index === 0 ? Brand.orangeDark : Brand.tealDark} />
            </View>
            <View style={styles.priorityCopy}>
              <Text style={styles.priorityTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.priorityMeta}>{item.category ?? 'Recommandation'} · Impact {item.impactScore}/10</Text>
            </View>
            <MaterialIcons name="chevron-right" size={21} color={Brand.slate400} />
          </Pressable>
        )) : (
          <View style={styles.empty}>
            <View style={styles.priorityIcon}><MaterialIcons name="radar" size={20} color={Brand.tealDark} /></View>
            <View style={styles.priorityCopy}>
              <Text style={styles.priorityTitle}>Vos priorités apparaîtront ici</Text>
              <Text style={styles.priorityMeta}>Lancez un audit pour démarrer.</Text>
            </View>
          </View>
        )}
      </RobiaCard>
    </RobiaScreen>
  );
}

function Metric({ icon, value, label, color, tint }: { icon: IconName; value: string | number; label: string; color: string; tint: string }) {
  return <View style={styles.metric}>
    <View style={[styles.metricIcon, { backgroundColor: tint }]}><MaterialIcons name={icon} size={18} color={color} /></View>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>;
}

const styles = StyleSheet.create({
  header: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { color: Brand.navyDark, fontFamily: Fonts.rounded, fontSize: 22, lineHeight: 28, fontWeight: '900', letterSpacing: -0.4 },
  context: { color: Brand.slate500, fontFamily: Fonts.sans, fontSize: 12, marginTop: 2 },
  roundButton: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.white, borderWidth: 1, borderColor: '#E8ECEF' },
  notificationDot: { position: 'absolute', right: 8, top: 8, width: 7, height: 7, borderRadius: 4, backgroundColor: Brand.orange, borderWidth: 1.5, borderColor: Brand.white },
  error: { padding: 12, borderRadius: 14, color: Brand.orangeDark, backgroundColor: Brand.orangeLight, fontWeight: '700' },
  balanceCard: { gap: 14, padding: 18, borderRadius: 22 },
  cardHeading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  balanceLabel: { color: Brand.slate500, fontFamily: Fonts.sans, fontSize: 12, fontWeight: '600' },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 3 },
  score: { color: Brand.navyDark, fontFamily: Fonts.rounded, fontSize: 42, lineHeight: 47, fontWeight: '900', letterSpacing: -1.2 },
  scoreSuffix: { color: Brand.slate400, fontSize: 14, fontWeight: '700' },
  trend: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 12, backgroundColor: Brand.tealLight },
  trendText: { color: Brand.tealDark, fontSize: 10, fontWeight: '800' },
  track: { height: 7, borderRadius: 4, overflow: 'hidden', backgroundColor: Brand.slate100 },
  fill: { height: '100%', borderRadius: 4, backgroundColor: Brand.teal },
  auditButton: { minHeight: 46, paddingHorizontal: 17, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Brand.navyDark },
  auditButtonText: { color: Brand.white, fontFamily: Fonts.sans, fontSize: 13, fontWeight: '800' },
  sectionHeading: { minHeight: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: Brand.navyDark, fontFamily: Fonts.rounded, fontSize: 17, fontWeight: '900' },
  sectionAction: { color: Brand.slate400, fontSize: 11, fontWeight: '600' },
  seeAll: { color: Brand.tealDark, fontSize: 11, fontWeight: '800' },
  metrics: { flexDirection: 'row', gap: 9 },
  metric: { flex: 1, minHeight: 116, padding: 12, borderRadius: 19, justifyContent: 'space-between', backgroundColor: Brand.white, borderWidth: 1, borderColor: '#E8ECEF' },
  metricIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  metricValue: { color: Brand.navyDark, fontFamily: Fonts.rounded, fontSize: 22, fontWeight: '900' },
  metricLabel: { color: Brand.slate500, fontFamily: Fonts.sans, fontSize: 10, lineHeight: 14, fontWeight: '600' },
  listCard: { paddingVertical: 3 },
  priorityRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 10 },
  rowBorder: { borderTopWidth: 1, borderTopColor: Brand.slate100 },
  priorityIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.tealLight },
  priorityCopy: { flex: 1, gap: 4 },
  priorityTitle: { color: Brand.navyDark, fontFamily: Fonts.sans, fontSize: 13, fontWeight: '800' },
  priorityMeta: { color: Brand.slate400, fontFamily: Fonts.sans, fontSize: 10.5, fontWeight: '600' },
  empty: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 11 },
  pressed: { opacity: 0.7 },
});