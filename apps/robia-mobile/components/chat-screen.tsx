import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { RobiaHeader, RobiaScreen, robiaStyles } from '@/components/robia-ui';
import { Brand } from '@/constants/theme';

const EXAMPLES = [
  { icon: 'question-answer', text: 'Comment améliorer ma visibilité en ligne ?' },
  { icon: 'radar', text: 'Analyse mon site et explique-moi les priorités.' },
  { icon: 'edit-note', text: 'Prépare un contenu et organise mes prochaines actions.' },
] as const;

const SHORTCUTS = [
  { icon: 'insights', label: 'Consulter mes opportunités', href: '/(tabs)/opportunities' },
  { icon: 'travel-explore', label: 'Lancer un audit', href: '/audit' },
  { icon: 'support-agent', label: 'Contacter l’équipe RobIA', href: '/support' },
] as const;

export default function ChatScreen() {
  return (
    <RobiaScreen fixedHeader>
      <RobiaHeader compact back title="Assistant RobIA" />

      <View style={s.welcome}>
        <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={s.avatar}>
          <MaterialIcons name="smart-toy" size={38} color={Brand.tealDark} />
        </View>
        <View style={s.badge}><Text style={s.badgeText}>Bientôt disponible</Text></View>
        <Text accessibilityRole="header" style={s.title}>Votre copilote, à votre écoute</Text>
        <Text style={s.intro}>
          RobIA vous aidera à comprendre vos résultats et à réaliser vos tâches à votre demande, depuis une conversation.
        </Text>
      </View>

      <View style={s.section}>
        <Text accessibilityRole="header" style={robiaStyles.cardTitle}>Ce que vous pourrez lui demander</Text>
        {EXAMPLES.map(example => (
          <View key={example.text} style={s.example}>
            <MaterialIcons accessible={false} name={example.icon} size={22} color={Brand.tealDark} />
            <Text style={s.exampleText}>« {example.text} »</Text>
          </View>
        ))}
      </View>

      <View style={s.section}>
        <Text style={robiaStyles.body}>
          La conversation et l’exécution de tâches par l’assistant ne sont pas encore disponibles.
        </Text>
        <View style={s.composer}>
          <TextInput
            testID="chat-composer"
            accessibilityLabel="Message à RobIA — bientôt disponible"
            accessibilityState={{ disabled: true }}
            editable={false}
            multiline
            placeholder="Vous pourrez bientôt écrire à RobIA…"
            placeholderTextColor={Brand.slate500}
            style={s.input}
          />
          <Pressable
            disabled
            accessibilityRole="button"
            accessibilityLabel="Envoyer un message — bientôt disponible"
            accessibilityState={{ disabled: true }}
            style={s.send}>
            <MaterialIcons accessible={false} name="arrow-upward" size={22} color={Brand.slate500} />
          </Pressable>
        </View>
      </View>

      <View style={s.section}>
        <Text accessibilityRole="header" style={robiaStyles.cardTitle}>En attendant</Text>
        <Text style={robiaStyles.body}>Accédez directement à vos outils RobIA.</Text>
        {SHORTCUTS.map(shortcut => (
          <Pressable
            key={shortcut.href}
            accessibilityRole="button"
            accessibilityLabel={shortcut.label}
            onPress={() => router.navigate(shortcut.href)}
            style={({ pressed }) => [s.shortcut, pressed && s.pressed]}>
            <MaterialIcons accessible={false} name={shortcut.icon} size={22} color={Brand.tealDark} />
            <Text style={s.shortcutLabel}>{shortcut.label}</Text>
            <MaterialIcons accessible={false} name="chevron-right" size={22} color={Brand.slate500} />
          </Pressable>
        ))}
      </View>
    </RobiaScreen>
  );
}

const s = StyleSheet.create({
  welcome: { alignItems: 'center', gap: 14, paddingVertical: 12 },
  avatar: { width: 80, height: 80, borderRadius: 28, backgroundColor: Brand.tealLight, alignItems: 'center', justifyContent: 'center' },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: Brand.surfaceSoft },
  badgeText: { color: Brand.slate500, fontSize: 13, fontWeight: '600' },
  title: { color: Brand.navyDark, fontSize: 25, lineHeight: 32, fontWeight: '800', textAlign: 'center' },
  intro: { ...robiaStyles.body, textAlign: 'center', maxWidth: 480 },
  section: { gap: 12 },
  example: { padding: 16, borderRadius: 18, backgroundColor: Brand.surfaceSoft, flexDirection: 'row', alignItems: 'center', gap: 12 },
  exampleText: { ...robiaStyles.body, flex: 1, color: Brand.navyDark },
  composer: { padding: 8, borderRadius: 20, backgroundColor: Brand.surfaceSoft, flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, minHeight: 52, padding: 10, fontSize: 15, color: Brand.slate500 },
  send: { width: 48, height: 48, borderRadius: 16, backgroundColor: Brand.slate200, alignItems: 'center', justifyContent: 'center' },
  shortcut: { minHeight: 56, paddingVertical: 12, gap: 12, flexDirection: 'row', alignItems: 'center' },
  shortcutLabel: { ...robiaStyles.body, flex: 1, color: Brand.navyDark, fontWeight: '600' },
  pressed: { opacity: 0.7 },
});
