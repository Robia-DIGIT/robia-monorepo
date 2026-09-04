import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { RobiaCard, RobiaHeader, RobiaScreen, StatusPill, robiaStyles } from '@/components/robia-ui';
import { Brand, Fonts } from '@/constants/theme';
import { queryString } from '@/src/api/client';
import type { Audit } from '@/src/api/types';
import { useRobiaData } from '@/src/api/data';
import { useSession } from '@/src/auth/session';
export default function HistoryScreen() {
  const { websites } = useRobiaData(); const { request } = useSession(); const [audits, setAudits] = useState<Audit[]>([]); const [loading, setLoading] = useState(true);
  useEffect(() => { void (async () => { try { const groups = await Promise.all(websites.map((site) => request<Audit[]>(`/audits${queryString({ website_id: site.id })}`))); setAudits(groups.flat().sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))); } finally { setLoading(false); } })(); }, [request, websites]);
  return <RobiaScreen><RobiaHeader eyebrow="VOTRE PROGRESSION" title="Historique des audits" subtitle="Comparez vos diagnostics et mesurez l’évolution de votre visibilité." />
    {loading ? <ActivityIndicator color={Brand.teal} /> : null}{!loading && !audits.length ? <RobiaCard><Text style={robiaStyles.cardTitle}>Aucun audit</Text><Text style={robiaStyles.body}>Votre historique se construira à chaque nouvelle analyse.</Text></RobiaCard> : null}
    {audits.map((audit, index) => <RobiaCard key={audit.id} style={styles.card} accent={index === 0 ? Brand.teal : undefined}><View style={styles.timeline}><View style={[styles.dot, index === 0 && styles.dotActive]} />{index < audits.length - 1 ? <View style={styles.line} /> : null}</View><View style={styles.copy}><Text style={robiaStyles.cardTitle}>{index === 0 ? 'Dernier diagnostic' : 'Audit du site'}</Text><Text style={robiaStyles.caption}>{new Date(audit.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</Text><StatusPill label={audit.status === 'completed' ? 'Terminé' : audit.status === 'failed' ? 'Échec' : 'En cours'} tone={audit.status === 'completed' ? 'teal' : audit.status === 'failed' ? 'orange' : 'neutral'} /></View><View style={styles.score}><Text style={styles.scoreValue}>{audit.globalScore ?? '—'}</Text><Text style={robiaStyles.caption}>/100</Text><MaterialIcons name="chevron-right" size={20} color={Brand.slate400} /></View></RobiaCard>)}
  </RobiaScreen>;
}
const styles = StyleSheet.create({ card: { minHeight: 116, flexDirection: 'row', gap: 13 }, timeline: { width: 14, alignItems: 'center' }, dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Brand.slate200 }, dotActive: { backgroundColor: Brand.teal }, line: { position: 'absolute', top: 16, bottom: -36, width: 2, backgroundColor: Brand.slate100 }, copy: { flex: 1, gap: 6 }, score: { alignItems: 'baseline', flexDirection: 'row', gap: 2 }, scoreValue: { color: Brand.navyDark, fontFamily: Fonts?.rounded, fontSize: 28, fontWeight: '900' } });
