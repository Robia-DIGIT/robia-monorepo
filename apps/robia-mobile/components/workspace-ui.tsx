import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { RobiaCard } from '@/components/robia-ui';
import { apiStyles as s } from '@/components/api-ui';
import { Brand } from '@/constants/theme';
export function NavCard({ title, description, href, icon = 'arrow-forward' }: { title: string; description: string; href: Href; icon?: React.ComponentProps<typeof MaterialIcons>['name'] }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title + '. ' + description} onPress={() => router.push(href)} style={({ pressed }) => ({ opacity: pressed ? .65 : 1 })}><RobiaCard style={styles.row}><View style={styles.icon}><MaterialIcons name={icon} size={25} color={Brand.tealDark} /></View><View style={{ flex: 1, gap: 5 }}><Text style={s.title}>{title}</Text><Text style={s.body}>{description}</Text></View><MaterialIcons name="chevron-right" size={24} color={Brand.tealDark} /></RobiaCard></Pressable>;
}
export function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange(value: boolean): void }) {
  return <View style={styles.row}><Text style={[s.body, { flex: 1 }]}>{label}</Text><Switch accessibilityLabel={label} value={value} onValueChange={onChange} /></View>;
}
const LABELS: Record<string, string> = { sending: 'Envoi en cours', dead_letter: 'Envoi interrompu', success: 'Synchronis?', draft: 'Brouillon', open: 'Ouvert', closed: 'Ferm?', archived: 'Archiv?', pending: 'En attente', pending_upload: 'Fichier attendu', received: 'Re?u', submitted: 'Soumis', screening: 'V?rification', incomplete: '? compl?ter', in_review: '? examiner', accepted: 'Accept?', rejected: 'Refus?', waitlisted: 'Liste d?attente', withdrawn: 'Retir?', queued: 'En attente', running: 'En cours', completed: 'Termin?', failed: '?chec', sent: 'Envoy?', skipped: 'Ignor?', partial: 'Partiel', never: 'Jamais synchronis?', succeeded: 'R?ussi' };
export const statusLabel = (status: string) => LABELS[status] ?? status;
export const dateLabel = (date?: string | null) => date ? new Date(date).function toLocaleString() { [native code] }('fr-FR') : '?';
export function Status({ value }: { value: string }) { return <Text style={styles.status}>{statusLabel(value)}</Text>; }
export function Metric({ label, value }: { label: string; value?: number | string | null }) { return <View style={styles.row}><Text style={[s.body, { flex: 1 }]}>{label}</Text><Text style={s.title}>{value ?? '?'}</Text></View>; }
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: 14 }, icon: { padding: 12, borderRadius: 14, backgroundColor: Brand.tealLight }, status: { color: Brand.tealDark, fontWeight: '700', fontSize: 14 } });
