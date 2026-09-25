import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/constants/theme';

export function WorkspaceHeader({ title }: { title: string }) {
  return <View style={s.header}>
    <Pressable accessibilityRole="button" accessibilityLabel="Mon profil et mon entreprise"
      onPress={() => router.push('/profile')} style={({ pressed }) => [s.button, s.profile, pressed && s.pressed]}>
      <MaterialIcons name="person-outline" size={24} color={Brand.tealDark} />
    </Pressable>
    <Text accessibilityRole="header" style={s.title}>{title}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Aide et support"
      onPress={() => router.push('/support')} style={({ pressed }) => [s.button, pressed && s.pressed]}>
      <MaterialIcons name="help-outline" size={23} color={Brand.navyDark} />
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Assistant RobIA"
      accessibilityHint="Découvrir l’assistant, bientôt disponible"
      onPress={() => router.push('/chat')} style={({ pressed }) => [s.button, pressed && s.pressed]}>
      <MaterialIcons name="chat-bubble-outline" size={23} color={Brand.navyDark} />
    </Pressable>
  </View>;
}
const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 56 },
  button: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  profile: { backgroundColor: Brand.tealLight },
  title: { flex: 1, minWidth: 0, marginLeft: 6, fontSize: 18, fontWeight: '800', color: Brand.navyDark },
  pressed: { opacity: .6 },
});
