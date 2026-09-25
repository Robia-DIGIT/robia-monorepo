import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { RobiaCard } from '@/components/robia-ui';
import { apiStyles as s } from '@/components/api-ui';
import { Brand } from '@/constants/theme';
export function NavCard({ title, description, href, icon = 'arrow-forward' }: { title: string; description: string; href: Href; icon?: React.ComponentProps<typeof MaterialIcons>['name'] }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title + '. ' + description} onPress={() => router.push(href)} style={({ pressed }) => ({ opacity: pressed ? .65 : 1 })}><RobiaCard style={styles.row}><View style={styles.icon}><MaterialIcons name={icon} size={25} color={Brand.tealDark} /></View><View style={{ flex: 1, minWidth: 0, gap: 5 }}><Text style={s.title}>{title}</Text><Text style={s.body}>{description}</Text></View><MaterialIcons name="chevron-right" size={24} color={Brand.tealDark} /></RobiaCard></Pressable>;
}
export function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange(value: boolean): void }) {
  return <View style={styles.row}><Text style={[s.body, { flex: 1 }]}>{label}</Text><Switch accessibilityLabel={label} value={value} onValueChange={onChange} /></View>;
}
const LABELS: Record<string, string> = { sending: 'Envoi en cours', dead_letter: 'Envoi interrompu', success: 'Synchronisé', draft: 'Brouillon', open: 'Ouvert', closed: 'Fermé', archived: 'Archivé', pending: 'En attente', pending_upload: 'Fichier attendu', received: 'Reçu', submitted: 'Soumis', screening: 'Vérification', incomplete: "À compléter", in_review: "À examiner", accepted: 'Accepté', rejected: 'Refusé', waitlisted: 'Liste d’attente', withdrawn: 'Retiré', queued: 'En attente', running: 'En cours', completed: 'Terminé', failed: 'Échec', sent: 'Envoyé', skipped: 'Ignoré', partial: 'Partiel', never: 'Jamais synchronisé', succeeded: 'Réussi' };
export const statusLabel = (status: string) => LABELS[status] ?? status;
export const dateLabel = (date?: string | null) => date ? new Date(date).toLocaleString('fr-FR') : "—";
export function Status({ value }: { value: string }) { return <Text style={styles.status}>{statusLabel(value)}</Text>; }
export function Metric({ label, value }: { label: string; value?: number | string | null }) { const { compact } = useResponsiveLayout(); return <View style={[styles.row, compact && { flexDirection: 'column', alignItems: 'stretch', gap: 4 }]}><Text style={[s.body, { flex: compact ? undefined : 1 }]}>{label}</Text><Text style={[s.title, { flexShrink: 1 }]}>{value ?? "—"}</Text></View>; }
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: 14 }, icon: { padding: 12, borderRadius: 14, backgroundColor: Brand.tealLight }, status: { color: Brand.tealDark, fontWeight: '700', fontSize: 14 } });
