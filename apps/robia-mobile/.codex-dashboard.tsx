import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { IconBadge, PrimaryButton, RobiaCard, RobiaHeader, RobiaScreen, SectionTitle, robiaStyles } from '@/components/robia-ui';
import { Brand, Fonts } from '@/constants/theme';
import { useRobiaData } from '@/src/api/data';
import { useSession } from '@/src/auth/session';

export default function HomeScreen() {
  const { user, organization } = useSession();
  const { latestAudit, opportunities, documents, actions, isLoading, error, refresh } = useRobiaData();
  const score = latestAudit?.globalScore ?? 0; const done = actions.filter((item) => item.status === 'done').length; const progress = actions.length ? Math.round(done / actions.length * 100) : 0;
  return <RobiaScreen>
    <RobiaHeader eyebrow="TABLEAU DE BORD" title={`Bonjour, ${user?.name?.split(' ')[0] ?? organization?.name ?? 'Entreprise'}`} subtitle={`${organization?.name ?? 'Votre espace'}${organization?.city ? ` · ${organization.city}` : ''} · Voici vos priorités digitales.`} action={<Pressable accessibilityLabel="Actualiser" onPress={() => void refresh()} style={styles.headerAction}>{isLoading ? <ActivityIndicator size="small" color={Brand.tealDark} /> : <MaterialIcons name="refresh" size={21} color={Brand.navyDark} />}</Pressable>} />
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <RobiaCard style={styles.scoreCard}>
      <View pointerEvents="none" style={styles.heroOrbLarge} />
      <View pointerEvents="none" style={styles.heroOrbSmall} />
      <View style={styles.scoreTop}><View><Text style={styles.scoreLabel}>Score de visibilité digitale</Text><View style={styles.scoreLine}><Text style={styles.score}>{score}</Text><Text style={styles.scoreTotal}>/100</Text></View></View><View style={styles.scoreBadge}><MaterialIcons name="auto-graph" size={28} color={Brand.tealDark} /></View></View>
      <View style={styles.track}><View style={[styles.fill, { width: `${Math.max(0, Math.min(score, 100))}%` }]} /></View>
      <Text style={robiaStyles.body}>{latestAudit ? 'Votre dernier diagnostic est synchronisé avec RobIA Copilot.' : 'Ajoutez votre site et lancez un audit pour obtenir votre premier diagnostic.'}</Text>
    </RobiaCard>
    <View style={styles.metrics}><Metric icon="track-changes" value={opportunities.length} label="Opportunités" /><Metric icon="description" value={documents.length} label="Documents" /><Metric icon="checklist" value={`${progress}%`} label="Plan d’action" /></View>
    <PrimaryButton label={latestAudit ? 'Lancer un nouvel audit' : 'Configurer et auditer mon site'} icon="radar" onPress={() => router.push('/audit')} />
    <SectionTitle title="À faire maintenant" />
    {opportunities[0] ? <Pressable onPress={() => router.navigate('/(tabs)/opportunities')}><RobiaCard style={styles.actionCard}><IconBadge name="auto-awesome" backgroundColor={Brand.orangeLight} color={Brand.orangeDark} /><View style={styles.actionCopy}><Text style={robiaStyles.cardTitle}>{opportunities[0].title}</Text><Text style={robiaStyles.body} numberOfLines={2}>{opportunities[0].description}</Text></View><MaterialIcons name="chevron-right" size={22} color={Brand.slate400} /></RobiaCard></Pressable> : <RobiaCard><Text style={robiaStyles.cardTitle}>Votre prochaine priorité apparaîtra ici</Text><Text style={robiaStyles.body}>RobIA classe automatiquement les opportunités après chaque audit.</Text></RobiaCard>}
  </RobiaScreen>;
}
function Metric({ icon, value, label }: { icon: React.ComponentProps<typeof MaterialIcons>['name']; value: string | number; label: string }) { return <View style={styles.metric}><MaterialIcons name={icon} size={19} color={Brand.tealDark} /><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>; }
const styles = StyleSheet.create({
  headerAction: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.white, borderWidth: 1, borderColor: Brand.slate200 },
  error: { padding: 12, borderRadius: 14, color: Brand.orangeDark, backgroundColor: Brand.orangeLight, fontWeight: '700' },
  scoreCard: { gap: 15, overflow: 'hidden', backgroundColor: Brand.navyDark, borderColor: Brand.navy },
  heroOrbLarge: { position: 'absolute', width: 170, height: 170, borderRadius: 85, right: -55, top: -80, backgroundColor: 'rgba(20,184,166,0.18)' },
  heroOrbSmall: { position: 'absolute', width: 80, height: 80, borderRadius: 40, right: 70, bottom: -52, backgroundColor: 'rgba(29,78,216,0.25)' },
  scoreTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoreLabel: { color: Brand.slate200, fontFamily: Fonts?.sans, fontSize: 13, fontWeight: '700' },
  scoreLine: { flexDirection: 'row', alignItems: 'baseline', marginTop: 3 },
  score: { color: Brand.white, fontFamily: Fonts?.rounded, fontSize: 48, fontWeight: '900', letterSpacing: -1.5 },
  scoreTotal: { color: Brand.slate400, fontSize: 15, fontWeight: '700' },
  scoreBadge: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.tealLight },
  track: { height: 8, borderRadius: 99, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.14)' },
  fill: { height: '100%', borderRadius: 99, backgroundColor: Brand.teal },
  metrics: { flexDirection: 'row', gap: 10 },
  metric: { flex: 1, minHeight: 112, padding: 13, borderRadius: 22, justifyContent: 'space-between', backgroundColor: Brand.white, borderWidth: 1, borderColor: 'rgba(226,232,240,0.85)', shadowColor: Brand.navyDark, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 1 },
  metricValue: { color: Brand.navyDark, fontSize: 24, fontWeight: '900' },
  metricLabel: { color: Brand.slate500, fontSize: 11, lineHeight: 15, fontWeight: '600' },
  actionCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionCopy: { flex: 1, gap: 3 },
});
