import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { IconBadge, RobiaCard, RobiaHeader, RobiaScreen, StatusPill, robiaStyles } from '@/components/robia-ui';
import { Brand } from '@/constants/theme';
import { useRobiaData } from '@/src/api/data';
import type { Opportunity } from '@/src/api/types';

export default function OpportunitiesScreen() {
  const { opportunities, latestAudit, isLoading, error, refresh, generateDocument, generateActions } = useRobiaData();
  const [busyId, setBusyId] = useState<string | null>(null);
  async function act(id: string, kind: 'document' | 'actions') { setBusyId(id); try { if (kind === 'document') await generateDocument(id); else await generateActions(id); } finally { setBusyId(null); } }
  return (
    <RobiaScreen>
      <RobiaHeader eyebrow="RECOMMANDATIONS IA" title="Opportunités" subtitle="Les actions les plus utiles détectées à partir de votre dernier audit." />
      <View style={styles.summary}><Text style={styles.summaryCount}>{opportunities.length}</Text><Text style={robiaStyles.body}>opportunités classées par impact.</Text></View>
      {isLoading && !opportunities.length ? <ActivityIndicator color={Brand.teal} /> : null}
      {error ? <Pressable onPress={() => void refresh()}><RobiaCard><Text style={styles.error}>{error}</Text><Text style={styles.retry}>Toucher pour réessayer</Text></RobiaCard></Pressable> : null}
      {!isLoading && !latestAudit ? <RobiaCard><Text style={robiaStyles.cardTitle}>Aucun audit disponible</Text><Text style={robiaStyles.body}>Lancez votre premier audit depuis l’accueil pour recevoir des recommandations.</Text></RobiaCard> : null}
      {opportunities.map((item, index) => <OpportunityCard key={item.id} item={item} index={index} busy={busyId === item.id} onAction={act} />)}
    </RobiaScreen>
  );
}

function OpportunityCard({ item, index, busy, onAction }: { item: Opportunity; index: number; busy: boolean; onAction(id: string, kind: 'document' | 'actions'): Promise<void> }) {
  const impact = item.impactScore >= 7 ? 'Prioritaire' : item.impactScore >= 4 ? 'Moyen' : 'Faible';
  return <RobiaCard style={styles.card}>
    <View style={styles.cardHeader}><IconBadge name={index === 0 ? 'auto-awesome' : 'insights'} backgroundColor={index === 0 ? Brand.orangeLight : Brand.tealLight} color={index === 0 ? Brand.orangeDark : Brand.tealDark} /><StatusPill label={impact} tone={impact === 'Prioritaire' ? 'orange' : 'teal'} /></View>
    <View><Text style={robiaStyles.caption}>{item.category ?? 'Visibilité digitale'}</Text><Text style={robiaStyles.cardTitle}>{item.title}</Text></View>
    <Text style={robiaStyles.body}>{item.description}</Text>
    <View style={styles.metaRow}><Meta label="Impact" value={`${item.impactScore}/10`} /><Meta label="Effort" value={`${item.effortScore}/10`} /><Meta label="Confiance" value={`${Math.round(item.confidenceScore <= 1 ? item.confidenceScore * 100 : item.confidenceScore)} %`} /></View>
    <View style={styles.actions}>
      <Pressable disabled={busy} onPress={() => void onAction(item.id, 'actions')} style={styles.secondaryButton}><MaterialIcons name="playlist-add-check" size={18} color={Brand.tealDark} /><Text style={styles.secondaryLabel}>Ajouter au plan</Text></Pressable>
      <Pressable disabled={busy} onPress={() => void onAction(item.id, 'document')} style={styles.primaryButton}>{busy ? <ActivityIndicator size="small" color={Brand.white} /> : <><MaterialIcons name="description" size={17} color={Brand.white} /><Text style={styles.primaryLabel}>Créer</Text></>}</Pressable>
    </View>
  </RobiaCard>;
}
function Meta({ label, value }: { label: string; value: string }) { return <View style={styles.meta}><Text style={robiaStyles.caption}>{label}</Text><Text style={styles.metaValue}>{value}</Text></View>; }
const styles = StyleSheet.create({
  summary: { padding: 16, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Brand.tealLight }, summaryCount: { color: Brand.tealDark, fontSize: 28, fontWeight: '900' }, card: { gap: 12 }, cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaRow: { paddingTop: 12, borderTopWidth: 1, borderTopColor: Brand.slate100, flexDirection: 'row', gap: 24 }, meta: { gap: 2 }, metaValue: { color: Brand.navyDark, fontSize: 13, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 9 }, secondaryButton: { flex: 1, minHeight: 43, borderRadius: 14, borderWidth: 1, borderColor: Brand.teal, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }, secondaryLabel: { color: Brand.tealDark, fontSize: 12, fontWeight: '800' }, primaryButton: { minWidth: 98, minHeight: 43, paddingHorizontal: 13, borderRadius: 14, backgroundColor: Brand.teal, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }, primaryLabel: { color: Brand.white, fontSize: 12, fontWeight: '800' }, error: { color: Brand.orangeDark, fontWeight: '700' }, retry: { marginTop: 5, color: Brand.tealDark, fontSize: 12 },
});
