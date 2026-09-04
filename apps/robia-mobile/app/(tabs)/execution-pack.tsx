import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { IconBadge, RobiaCard, RobiaHeader, RobiaScreen, StatusPill, robiaStyles } from '@/components/robia-ui';
import { Brand } from '@/constants/theme';
import { useRobiaData } from '@/src/api/data';

const TYPE_LABELS: Record<string, string> = { local_page: 'Page locale', faq: 'FAQ', meta: 'Métadonnées SEO', gbp_post: 'Publication Google', review_reply: 'Réponse à un avis', dev_brief: 'Brief développeur', checklist: 'Checklist d’exécution' };
export default function ExecutionPackScreen() {
  const { documents, opportunities, isLoading } = useRobiaData(); const ready = documents.filter((item) => item.status !== 'draft').length;
  return <RobiaScreen><RobiaHeader eyebrow="CENTRE DE PRODUCTION" title="Documents" subtitle="Les livrables générés par RobIA restent sous votre contrôle avant publication." />
    <View style={styles.progressCard}><IconBadge name="task-alt" /><View style={styles.progressCopy}><Text style={robiaStyles.cardTitle}>{documents.length} document{documents.length > 1 ? 's' : ''}</Text><Text style={robiaStyles.body}>{ready} modifié{ready > 1 ? 's' : ''} ou validé{ready > 1 ? 's' : ''}.</Text></View></View>
    {isLoading && !documents.length ? <ActivityIndicator color={Brand.teal} /> : null}
    {!isLoading && !documents.length ? <RobiaCard><Text style={robiaStyles.cardTitle}>Aucun document</Text><Text style={robiaStyles.body}>{opportunities.length ? 'Ouvrez une opportunité et touchez « Créer » pour générer son premier livrable.' : 'Les documents seront disponibles après votre premier audit.'}</Text></RobiaCard> : null}
    {documents.map((doc) => <RobiaCard key={doc.id} style={styles.card}><View style={styles.documentIcon}><MaterialIcons name="description" size={23} color={Brand.tealDark} /></View><View style={styles.documentCopy}><Text style={robiaStyles.caption}>{TYPE_LABELS[doc.type] ?? doc.type}</Text><Text style={robiaStyles.cardTitle}>{doc.title}</Text><Text numberOfLines={2} style={robiaStyles.body}>{doc.content}</Text></View><StatusPill label={doc.status === 'draft' ? 'Brouillon' : doc.status === 'edited' ? 'Modifié' : 'Validé'} tone={doc.status === 'validated' ? 'teal' : 'neutral'} /></RobiaCard>)}
  </RobiaScreen>;
}
const styles = StyleSheet.create({ progressCard: { padding: 16, borderRadius: 22, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Brand.tealLight }, progressCopy: { flex: 1, gap: 2 }, card: { minHeight: 98, flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, documentIcon: { width: 46, height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.slate100 }, documentCopy: { flex: 1, gap: 4 } });
