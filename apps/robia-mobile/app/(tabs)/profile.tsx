import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RobiaCard, RobiaHeader, RobiaScreen, SectionTitle, robiaStyles } from '@/components/robia-ui';
import { Brand, Fonts } from '@/constants/theme';
import { useRobiaData } from '@/src/api/data';
import { useSession } from '@/src/auth/session';

const LINKS = [
  { label: 'Historique des audits', description: 'Consulter les analyses précédentes', icon: 'history', href: '/history' },
  { label: 'Rapports', description: 'Suivre les performances', icon: 'assessment', href: '/reports' },
  { label: 'Paramètres du compte', description: 'Gérer les préférences', icon: 'settings', href: '/settings' },
] as const;
export default function ProfileScreen() {
  const { user, organization, logout } = useSession(); const { websites } = useRobiaData();
  const initials = (user?.name ?? organization?.name ?? 'R').split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  async function signOut() { await logout(); router.replace('/auth'); }
  return <RobiaScreen><RobiaHeader eyebrow="MON ESPACE" title="Profil" subtitle="Votre organisation et les ressources connectées à RobIA." />
    <RobiaCard style={styles.profileCard} accent={Brand.teal}><View style={styles.avatar}><Text style={styles.initials}>{initials}</Text></View><View style={styles.profileCopy}><Text style={styles.name}>{organization?.name ?? user?.company ?? 'Entreprise'}</Text><Text style={robiaStyles.body}>{user?.name}</Text><Text style={robiaStyles.caption}>{user?.email}</Text></View></RobiaCard>
    <View style={styles.metrics}><Metric value={websites.length} label="Sites connectés" /><Metric value={organization?.city ?? '—'} label="Ville" /></View>
    <SectionTitle title="Votre espace" /><RobiaCard style={styles.linksCard}>{LINKS.map((item, index) => <Pressable key={item.href} onPress={() => router.push(item.href)} style={({ pressed }) => [styles.linkRow, index > 0 && styles.linkBorder, pressed && styles.pressed]}><View style={styles.linkIcon}><MaterialIcons name={item.icon} size={21} color={Brand.tealDark} /></View><View style={styles.linkCopy}><Text style={robiaStyles.cardTitle}>{item.label}</Text><Text style={robiaStyles.caption}>{item.description}</Text></View><MaterialIcons name="chevron-right" size={22} color={Brand.slate400} /></Pressable>)}</RobiaCard>
    <Pressable onPress={() => void signOut()} style={({ pressed }) => [styles.logout, pressed && styles.pressed]}><MaterialIcons name="logout" size={19} color={Brand.orangeDark} /><Text style={styles.logoutText}>Se déconnecter</Text></Pressable>
    <Text style={styles.version}>RobIA Copilot · API connectée</Text>
  </RobiaScreen>;
}
function Metric({ value, label }: { value: string | number; label: string }) { return <RobiaCard style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={robiaStyles.caption}>{label}</Text></RobiaCard>; }
const styles = StyleSheet.create({ profileCard: { flexDirection: 'row', alignItems: 'center', gap: 13 }, avatar: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.tealLight }, initials: { color: Brand.tealDark, fontFamily: Fonts?.rounded, fontSize: 20, fontWeight: '900' }, profileCopy: { flex: 1, gap: 3 }, name: { color: Brand.navyDark, fontFamily: Fonts?.rounded, fontSize: 19, fontWeight: '900' }, metrics: { flexDirection: 'row', gap: 12 }, metric: { flex: 1, gap: 5 }, metricValue: { color: Brand.navyDark, fontSize: 20, fontWeight: '900' }, linksCard: { paddingVertical: 4 }, linkRow: { minHeight: 76, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }, linkBorder: { borderTopWidth: 1, borderTopColor: Brand.slate100 }, linkIcon: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.tealLight }, linkCopy: { flex: 1, gap: 3 }, logout: { minHeight: 50, borderRadius: 17, borderWidth: 1, borderColor: Brand.orangeLight, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, logoutText: { color: Brand.orangeDark, fontWeight: '800' }, pressed: { opacity: 0.65 }, version: { textAlign: 'center', color: Brand.slate400, fontSize: 12 } });
