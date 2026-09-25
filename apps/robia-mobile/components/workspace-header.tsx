import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/constants/theme';

export function WorkspaceHeader({ title, back = false }: { title: string; back?: boolean }) {
  return <View style={s.header}>
    {back ? <Pressable accessibilityRole="button" accessibilityLabel="Revenir à l’écran précédent"
      onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/dashboard')} style={s.button}>
      <MaterialIcons name="arrow-back" size={23} color={Brand.navyDark} />
    </Pressable> : null}
    {!back ? <Pressable accessibilityRole="button" accessibilityLabel="Mon profil et mon entreprise"
      onPress={() => router.navigate('/profile')} style={({ pressed }) => [s.button, s.profile, pressed && s.pressed]}>
      <MaterialIcons name="person-outline" size={24} color={Brand.tealDark} />
    </Pressable> : null}
    <Text accessibilityRole="header" style={s.title}>{title}</Text>
    {back ? <ProfileShortcut /> : <Pressable accessibilityRole="button" accessibilityLabel="Aide et support"
      onPress={() => router.push('/support')} style={({ pressed }) => [s.button, pressed && s.pressed]}>
      <MaterialIcons name="help-outline" size={23} color={Brand.navyDark} />
    </Pressable>}
    <Pressable accessibilityRole="button" accessibilityLabel="Assistant RobIA"
      accessibilityHint="Découvrir l’assistant, bientôt disponible"
      onPress={() => router.push('/chat')} style={({ pressed }) => [s.button, pressed && s.pressed]}>
      <MaterialIcons name="chat-bubble-outline" size={23} color={Brand.navyDark} />
    </Pressable>
  </View>;
}
export function ProfileShortcut() {
  return <Pressable accessibilityRole="button" accessibilityLabel="Mon profil et mon entreprise" onPress={() => router.navigate('/profile')} style={({ pressed }) => [s.button, s.profile, pressed && s.pressed]}>
    <MaterialIcons name="person-outline" size={24} color={Brand.tealDark} />
  </Pressable>;
}
const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 56 },
  button: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  profile: { backgroundColor: Brand.tealLight },
  title: { flex: 1, minWidth: 0, marginLeft: 6, fontSize: 18, fontWeight: '800', color: Brand.navyDark },
  pressed: { opacity: .6 },
});
