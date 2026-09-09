import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RobiaCard, RobiaScreen } from '@/components/robia-ui';
import { Brand, Fonts } from '@/constants/theme';
import { useRobiaData } from '@/src/api/data';
import { useSession } from '@/src/auth/session';

const LINKS = [
  { label: 'Historique des audits', description: 'Toutes vos analyses', icon: 'history', href: '/history' },
  { label: 'Rapports', description: 'Mesurer les performances', icon: 'assessment', href: '/reports' },
  { label: 'Paramètres du compte', description: 'Sécurité et préférences', icon: 'settings', href: '/settings' },
] as const;

export default function ProfileScreen() {
  const { user, organization, logout } = useSession();
  const { websites } = useRobiaData();
  const initials = (user?.name ?? organization?.name ?? 'R').split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase();

  async function signOut() {
    await logout();
    router.replace('/auth');
  }

  return (
    <RobiaScreen>
      <View style={styles.topBar}>
        <View style={styles.topSpacer} />
        <Text style={styles.pageTitle}>Profil</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Modifier le profil" onPress={() => router.push('/settings')} style={styles.editButton}>
          <MaterialIcons name="edit" size={18} color={Brand.navyDark} />
        </Pressable>
      </View>

      <View style={styles.identity}>
        <View style={styles.avatarRing}>
          <View style={styles.avatar}><Text style={styles.initials}>{initials}</Text></View>
          <View style={styles.verified}><MaterialIcons name="verified" size={17} color={Brand.white} /></View>
        </View>
        <Text style={styles.name}>{user?.name ?? organization?.name ?? 'Mon entreprise'}</Text>
        <Text style={styles.role}>{organization?.name ?? user?.company ?? 'Espace ROBIA'}</Text>
      </View>

      <RobiaCard style={styles.infoCard}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>Informations</Text>
          <Pressable onPress={() => router.push('/settings')}><Text style={styles.editText}>Modifier</Text></Pressable>
        </View>
        <InfoRow icon="business" label="Organisation" value={organization?.name ?? 'Non renseignée'} />
        <InfoRow icon="email" label="E-mail" value={user?.email ?? 'Non renseigné'} />
        <InfoRow icon="location-on" label="Localisation" value={[organization?.city, organization?.country].filter(Boolean).join(', ') || 'Non renseignée'} />
        <InfoRow icon="language" label="Sites connectés" value={websites.length + (websites.length > 1 ? ' sites' : ' site')} last />
      </RobiaCard>

      <RobiaCard style={styles.linksCard}>
        <Text style={styles.cardTitle}>Compte</Text>
        {LINKS.map((item, index) => (
          <Pressable key={item.href} onPress={() => router.push(item.href)} style={({ pressed }) => [styles.linkRow, index > 0 && styles.linkBorder, pressed && styles.pressed]}>
            <View style={styles.linkIcon}><MaterialIcons name={item.icon} size={20} color={Brand.tealDark} /></View>
            <View style={styles.linkCopy}>
              <Text style={styles.linkTitle}>{item.label}</Text>
              <Text style={styles.linkDescription}>{item.description}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={21} color={Brand.slate400} />
          </Pressable>
        ))}
      </RobiaCard>

      <Pressable accessibilityRole="button" onPress={() => void signOut()} style={({ pressed }) => [styles.logout, pressed && styles.pressed]}>
        <MaterialIcons name="logout" size={18} color={Brand.orangeDark} />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </Pressable>
      <Text style={styles.version}>ROBIA COPILOT · ESPACE SÉCURISÉ</Text>
    </RobiaScreen>
  );
}

function InfoRow({ icon, label, value, last = false }: { icon: React.ComponentProps<typeof MaterialIcons>['name']; label: string; value: string; last?: boolean }) {
  return <View style={[styles.infoRow, !last && styles.infoBorder]}>
    <MaterialIcons name={icon} size={19} color={Brand.navyDark} />
    <View style={styles.infoCopy}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  topBar: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topSpacer: { width: 40 },
  pageTitle: { color: Brand.navyDark, fontFamily: Fonts.rounded, fontSize: 16, fontWeight: '900' },
  editButton: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.white, borderWidth: 1, borderColor: '#E8ECEF' },
  identity: { alignItems: 'center', marginTop: -2, marginBottom: 2 },
  avatarRing: { width: 92, height: 92, padding: 4, borderRadius: 46, backgroundColor: Brand.white, borderWidth: 1, borderColor: Brand.slate200 },
  avatar: { flex: 1, borderRadius: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.tealLight },
  initials: { color: Brand.tealDark, fontFamily: Fonts.rounded, fontSize: 28, fontWeight: '900' },
  verified: { position: 'absolute', right: 0, bottom: 3, width: 27, height: 27, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.teal, borderWidth: 3, borderColor: Brand.white },
  name: { color: Brand.navyDark, fontFamily: Fonts.rounded, fontSize: 21, fontWeight: '900', marginTop: 10 },
  role: { color: Brand.slate500, fontFamily: Fonts.sans, fontSize: 12, marginTop: 3 },
  infoCard: { paddingTop: 17, paddingBottom: 4 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  cardTitle: { color: Brand.navyDark, fontFamily: Fonts.rounded, fontSize: 16, fontWeight: '900', marginBottom: 6 },
  editText: { color: Brand.tealDark, fontFamily: Fonts.sans, fontSize: 11, fontWeight: '800' },
  infoRow: { minHeight: 61, flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoBorder: { borderBottomWidth: 1, borderBottomColor: Brand.slate100 },
  infoCopy: { flex: 1, gap: 2 },
  infoLabel: { color: Brand.slate400, fontFamily: Fonts.sans, fontSize: 10, fontWeight: '600' },
  infoValue: { color: Brand.navyDark, fontFamily: Fonts.sans, fontSize: 12.5, lineHeight: 17, fontWeight: '700' },
  linksCard: { paddingTop: 17, paddingBottom: 3 },
  linkRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 11 },
  linkBorder: { borderTopWidth: 1, borderTopColor: Brand.slate100 },
  linkIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.tealLight },
  linkCopy: { flex: 1, gap: 2 },
  linkTitle: { color: Brand.navyDark, fontFamily: Fonts.sans, fontSize: 13, fontWeight: '800' },
  linkDescription: { color: Brand.slate400, fontFamily: Fonts.sans, fontSize: 10.5 },
  logout: { minHeight: 48, borderRadius: 16, borderWidth: 1, borderColor: Brand.orangeLight, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFFDFC' },
  logoutText: { color: Brand.orangeDark, fontFamily: Fonts.sans, fontSize: 13, fontWeight: '800' },
  version: { textAlign: 'center', color: Brand.slate400, fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  pressed: { opacity: 0.65 },
});