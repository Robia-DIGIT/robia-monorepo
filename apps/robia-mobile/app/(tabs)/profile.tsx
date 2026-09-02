import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RobiaCard, RobiaHeader, RobiaScreen, SectionTitle, robiaStyles } from '@/components/robia-ui';
import { Brand, Fonts } from '@/constants/theme';
import { MOCK_ESTABLISHMENT } from '@/src/data/mock';

const LINKS = [
  { label: 'Historique des audits', description: 'Retrouvez vos analyses précédentes', icon: 'history', href: '/history' },
  { label: 'Rapports mensuels', description: 'Consultez vos synthèses de performance', icon: 'assessment', href: '/reports' },
  { label: 'Paramètres du compte', description: 'Gérez vos préférences et informations', icon: 'settings', href: '/settings' },
] as const;

export default function ProfileScreen() {
  return (
    <RobiaScreen>
      <RobiaHeader eyebrow="MON ESPACE" title="Profil" subtitle="Votre établissement et vos préférences RobIA." />
      <RobiaCard style={styles.profileCard} accent={Brand.teal}>
        <View style={styles.avatar}><Text style={styles.initials}>SL</Text></View>
        <View style={styles.profileCopy}><Text style={styles.name}>{MOCK_ESTABLISHMENT.name}</Text><View style={styles.location}><MaterialIcons name="location-on" size={15} color={Brand.tealDark} /><Text style={robiaStyles.body}>{MOCK_ESTABLISHMENT.city}</Text></View></View>
        <Image source={require('@/assets/images/logo-robia-copilot.svg')} contentFit="contain" style={styles.miniLogo} />
      </RobiaCard>
      <SectionTitle title="Votre espace" />
      <RobiaCard style={styles.linksCard}>
        {LINKS.map((item, index) => (
          <Pressable key={item.href} accessibilityRole="button" onPress={() => router.push(item.href)} style={({ pressed }) => [styles.linkRow, index > 0 && styles.linkBorder, pressed && styles.pressed]}>
            <View style={styles.linkIcon}><MaterialIcons name={item.icon} size={21} color={Brand.tealDark} /></View>
            <View style={styles.linkCopy}><Text style={robiaStyles.cardTitle}>{item.label}</Text><Text style={robiaStyles.caption}>{item.description}</Text></View>
            <MaterialIcons name="chevron-right" size={22} color={Brand.slate400} />
          </Pressable>
        ))}
      </RobiaCard>
      <Text style={styles.version}>RobIA Copilot · Version 1.0.0</Text>
    </RobiaScreen>
  );
}

const styles = StyleSheet.create({
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  avatar: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.tealLight },
  initials: { color: Brand.tealDark, fontFamily: Fonts?.rounded, fontSize: 20, fontWeight: '900' },
  profileCopy: { flex: 1, gap: 5 },
  name: { color: Brand.navyDark, fontFamily: Fonts?.rounded, fontSize: 19, fontWeight: '900' },
  location: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  miniLogo: { width: 42, height: 30 },
  linksCard: { paddingVertical: 4 },
  linkRow: { minHeight: 78, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  linkBorder: { borderTopWidth: 1, borderTopColor: Brand.slate100 },
  linkIcon: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.tealLight },
  linkCopy: { flex: 1, gap: 3 },
  pressed: { opacity: 0.65 },
  version: { textAlign: 'center', color: Brand.slate400, fontSize: 12 },
});
