import { QuickActions } from '@/components/collection-ui';
import { WorkspaceHeader } from '@/components/workspace-header';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { AsyncButton } from '@/components/api-ui';
import { auditScore } from '@/src/api/presentation';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View, type DimensionValue } from 'react-native';

import { RobiaCard, RobiaScreen } from '@/components/robia-ui';
import { SiteSelector } from '@/components/site-selector';
import { Brand, Fonts } from '@/constants/theme';
import { useRobiaData } from '@/src/api/data';
import { useSession } from '@/src/auth/session';
import * as SecureStore from 'expo-secure-store';
import { useEffect } from 'react';
import { CopilotStep, useCopilot, walkthroughable } from 'react-native-copilot';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];
const CopilotTarget = walkthroughable(View);
const GUIDE_SEEN_KEY = 'robia.dashboard-guide-seen';

const TOOLS = [
  { label: 'Mes performances', description: 'Comprendre mes résultats', icon: 'insights', href: '/(tabs)/visibility?section=performance' },
  { label: 'Mes actions', description: 'Choisir mes prochaines étapes', icon: 'checklist', href: '/(tabs)/work?section=actions' },
  { label: 'Mes documents', description: 'Retrouver mes contenus', icon: 'description', href: '/(tabs)/work?section=documents' },
  { label: 'Candidatures', description: 'Programmes et dossiers', icon: 'groups', href: '/(tabs)/work?section=programs' },
] as const;

export default function HomeScreen() {
  const { start } = useCopilot();
  const layout = useResponsiveLayout();
  const metricWidth = (layout.contentWidth - 9 * (layout.metricColumns - 1)) / layout.metricColumns;
  const { user, organization, sessionError, refreshOrganization } = useSession();
  const { latestAudit, opportunities, documents, actions, error, refresh, isLoading } = useRobiaData();
  const displayScore = auditScore(latestAudit);
  const score = displayScore.value;
  const done = actions.filter((item) => item.status === 'done').length;
  const progress = actions.length ? Math.round((done / actions.length) * 100) : 0;
  const firstName = user?.name?.split(' ')[0] ?? organization?.name ?? 'Entreprise';

  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    void SecureStore.getItemAsync(GUIDE_SEEN_KEY).then((seen) => {
      if (!mounted || seen) return;
      timer = setTimeout(() => {
        void start('normal');
        void SecureStore.setItemAsync(GUIDE_SEEN_KEY, 'true');
      }, 700);
    }).catch(() => { });
    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [start]);


  return (
    <RobiaScreen fixedHeader refreshing={isLoading} onRefresh={refresh}>
      <CopilotStep order={1} name="welcome" text="Votre tableau de bord rassemble les indicateurs et les prochaines actions de votre entreprise.">
        <CopilotTarget style={styles.header}>
          <WorkspaceHeader title="Accueil" />
        </CopilotTarget>
      </CopilotStep>

      <View style={{ gap: 4 }}>
        <Text style={styles.greeting}>Bonjour, {firstName}</Text>
        <Text style={styles.context}>{organization?.city ?? 'Votre espace'} · Votre visibilité aujourd’hui</Text>
      </View>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}


      {!organization ? <AsyncButton label="Compléter mon organisation" action={async () => router.push("/settings")} /> : null}
      {sessionError ? <AsyncButton label={sessionError + " · Réessayer"} action={refreshOrganization} /> : null}
      {/* <AsyncButton label={isLoading ? "Actualisation…" : "Actualiser mes données"} disabled={isLoading} action={refresh} /> */}
      <CopilotStep order={3} name="audit-score" text="Votre score de visibilité résume le dernier diagnostic. Lancez un audit pour obtenir vos premières recommandations.">
        <CopilotTarget>
          <RobiaCard style={styles.balanceCard}>
            <CopilotStep order={2} name="site-selector" text="Sélectionnez le site à analyser. Vous pouvez en connecter plusieurs depuis cet espace.">
              <CopilotTarget><SiteSelector /></CopilotTarget>
            </CopilotStep>
            <View style={styles.cardHeading}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.balanceLabel}>{displayScore.label}</Text>
                <View style={styles.scoreRow}>
                  <Text style={styles.score}>{score ?? '—'}</Text>
                  <Text style={styles.scoreSuffix}>/100</Text>
                </View>
              </View>
            </View>
            <View
              accessible
              accessibilityRole="progressbar"
              accessibilityLabel={displayScore.label}
              accessibilityValue={{ min: 0, max: 100, now: score ?? 0, text: score == null ? "Non mesuré" : `${score} sur 100` }}
              style={styles.track}>
              <View style={[styles.fill, { width: (Math.max(0, Math.min(score ?? 0, 100)) + '%') as DimensionValue }]} />
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={latestAudit ? "Relancer mon audit" : "Lancer mon premier audit"} onPress={() => router.push('/audit')} style={({ pressed }) => [styles.auditButton, pressed && styles.pressed]}>
              <Text style={styles.auditButtonText}>{latestAudit ? 'Relancer mon audit' : 'Lancer mon premier audit'}</Text>
              <MaterialIcons name="arrow-forward" size={18} color={Brand.white} />
            </Pressable>
          </RobiaCard>
        </CopilotTarget>
      </CopilotStep>

      <CopilotStep order={4} name="activity" text="Retrouvez ici vos opportunités, vos documents et l'avancement de votre plan d'action.">
        <CopilotTarget style={styles.guideTarget}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Votre activité</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Ouvrir la vue d’ensemble" onPress={() => router.push("/intelligence")} style={styles.sectionLink}><Text style={styles.seeAll}>Vue d’ensemble</Text></Pressable>
          </View>
          <View style={styles.metrics}>
            <Metric width={metricWidth} icon="lightbulb" value={opportunities.length} label="Opportunités" color={Brand.orange} tint={Brand.orangeLight} />
            <Metric width={metricWidth} icon="description" value={documents.length} label="Documents" color={Brand.electric} tint={Brand.electricLight} />
            <Metric width={metricWidth} icon="task-alt" value={progress + '%'} label="Plan réalisé" color={Brand.tealDark} tint={Brand.tealLight} />
          </View>
        </CopilotTarget>
      </CopilotStep>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Outils</Text>
        <Text style={styles.sectionAction}>Accès rapide</Text>
      </View>
      <QuickActions items={TOOLS} />

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Priorités</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Voir toutes les opportunités" onPress={() => router.navigate('/opportunities')} style={styles.sectionLink}><Text style={styles.seeAll}>Tout voir</Text></Pressable>
      </View>
      <RobiaCard style={styles.listCard}>
        {opportunities.length ? opportunities.slice(0, 3).map((item, index) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}. ${item.category ?? 'Recommandation'}. Impact ${item.impactScore} sur 10`}
            accessibilityHint="Ouvre le détail de cette opportunité"
            onPress={() => router.push({ pathname: "/opportunity", params: { id: item.id } })}
            style={({ pressed }) => [styles.priorityRow, index > 0 && styles.rowBorder, pressed && styles.pressed]}>
            <View style={[styles.priorityIcon, { backgroundColor: index === 0 ? Brand.orangeLight : Brand.tealLight }]}>
              <MaterialIcons name="lightbulb" size={19} color={index === 0 ? Brand.orangeDark : Brand.tealDark} />
            </View>
            <View style={styles.priorityCopy}>
              <Text style={styles.priorityTitle}>{item.title}</Text>
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

function Metric({ width, icon, value, label, color, tint }: { width: number; icon: IconName; value: string | number; label: string; color: string; tint: string }) {
  return <View accessible accessibilityLabel={`${label} : ${value}`} style={[styles.metric, { width }]}>
    <View style={[styles.metricIcon, { backgroundColor: tint }]}><MaterialIcons name={icon} size={18} color={color} /></View>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>;
}

const styles = StyleSheet.create({
  header: { minHeight: 64, alignSelf: 'stretch' },
  guideTarget: { gap: 9 },
  guideButton: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.tealLight },
  greeting: { color: Brand.navyDark, fontFamily: Fonts.rounded, fontSize: 22, lineHeight: 28, fontWeight: '900', letterSpacing: -0.4 },
  context: { color: Brand.slate500, fontFamily: Fonts.sans, fontSize: 14, lineHeight: 20, marginTop: 2 },
  roundButton: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.surfaceSoft, borderWidth: 0, },
  notificationDot: { position: 'absolute', right: 8, top: 8, width: 7, height: 7, borderRadius: 4, backgroundColor: Brand.orange, borderWidth: 1.5, borderColor: Brand.white },
  error: { padding: 12, borderRadius: 14, color: Brand.orangeDark, backgroundColor: Brand.orangeLight, fontWeight: '700' },
  balanceCard: { gap: 14, padding: 18, borderRadius: 12 },
  cardHeading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  balanceLabel: { color: Brand.slate500, fontFamily: Fonts.sans, fontSize: 14, fontWeight: '600' },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 3 },
  score: { color: Brand.navyDark, fontFamily: Fonts.rounded, fontSize: 42, lineHeight: 47, fontWeight: '900', letterSpacing: -1.2 },
  scoreSuffix: { color: Brand.slate400, fontSize: 14, fontWeight: '700' },
  trend: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 12, backgroundColor: Brand.tealLight },
  trendText: { color: Brand.tealDark, fontSize: 12, fontWeight: '800' },
  track: { height: 7, borderRadius: 4, overflow: 'hidden', backgroundColor: Brand.slate100 },
  fill: { height: '100%', borderRadius: 4, backgroundColor: Brand.teal },
  auditButton: { minHeight: 50, paddingVertical: 12, paddingHorizontal: 17, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Brand.navyDark },
  auditButtonText: { flexShrink: 1, textAlign: 'center', color: Brand.white, fontFamily: Fonts.sans, fontSize: 14, fontWeight: '800' },
  sectionHeading: { minHeight: 26, flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: Brand.navyDark, fontFamily: Fonts.rounded, fontSize: 17, fontWeight: '900' },
  sectionAction: { color: Brand.slate400, fontSize: 11, fontWeight: '600' },
  sectionLink: { minHeight: 48, paddingHorizontal: 4, justifyContent: 'center' },
  seeAll: { color: Brand.tealDark, fontSize: 13, fontWeight: '800' },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  metric: { minHeight: 116, padding: 12, borderRadius: 10, justifyContent: 'space-between', backgroundColor: Brand.white, borderWidth: 0, },
  metricIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  metricValue: { color: Brand.navyDark, fontFamily: Fonts.rounded, fontSize: 22, fontWeight: '900' },
  metricLabel: { color: Brand.slate500, fontFamily: Fonts.sans, fontSize: 12, lineHeight: 16, fontWeight: '600' },
  toolsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  tool: { minHeight: 70, padding: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Brand.white },
  toolIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.tealLight },
  toolCopy: { flex: 1, gap: 2 },
  toolTitle: { color: Brand.navyDark, fontFamily: Fonts.sans, fontSize: 12, fontWeight: '800' },
  toolDescription: { color: Brand.slate400, fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18, fontWeight: '600' },
  listCard: { paddingVertical: 3 },
  priorityRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 10 },
  rowBorder: { borderTopWidth: 1, borderTopColor: Brand.slate100 },
  priorityIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.tealLight },
  priorityCopy: { flex: 1, gap: 4 },
  priorityTitle: { color: Brand.navyDark, fontFamily: Fonts.sans, fontSize: 14, fontWeight: '800' },
  priorityMeta: { color: Brand.slate400, fontFamily: Fonts.sans, fontSize: 12, lineHeight: 17, fontWeight: '600' },
  empty: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 11 },
  pressed: { opacity: 0.7 },
});
