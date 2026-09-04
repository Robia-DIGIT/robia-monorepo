import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, Fonts } from '@/constants/theme';
import { useSession } from '@/src/auth/session';

type Message = { id: string; role: 'assistant' | 'user'; text: string };

const SUGGESTIONS = [
  { icon: 'campaign' as const, label: 'Créer une publication' },
  { icon: 'insights' as const, label: 'Analyser mes résultats' },
  { icon: 'lightbulb' as const, label: 'Trouver une idée marketing' },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'welcome',
    role: 'assistant',
    text: 'Bonjour ! Je suis votre copilote marketing RobIA. Comment puis-je vous aider aujourd’hui ?',
  },
];

function mockAnswer(question: string) {
  const normalized = question.toLocaleLowerCase('fr-FR');
  if (normalized.includes('publication')) {
    return 'Avec plaisir. Indiquez-moi le réseau social, votre objectif et le sujet à mettre en avant. Je préparerai une première proposition.';
  }
  if (normalized.includes('résultat') || normalized.includes('analyse')) {
    return 'Je peux vous aider à interpréter votre visibilité, vos opportunités et votre plan d’action. La connexion aux données détaillées sera activée avec le futur backend.';
  }
  if (normalized.includes('idée') || normalized.includes('marketing')) {
    return 'Commençons par votre objectif : gagner en visibilité, générer des prospects ou fidéliser vos clients ?';
  }
  return 'J’ai bien reçu votre demande. Cette conversation fonctionne actuellement en mode démonstration ; bientôt, je pourrai exploiter directement les données de votre espace RobIA.';
}

export default function ChatScreen() {
  const { user, organization } = useSession();
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const firstName = user?.name?.split(' ')[0] ?? organization?.name ?? 'vous';

  function scrollToEnd() {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }

  function send(value = draft) {
    const text = value.trim();
    if (!text || thinking) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMessages((current) => [...current, { id: `user-${Date.now()}`, role: 'user', text }]);
    setDraft('');
    setThinking(true);
    scrollToEnd();
    setTimeout(() => {
      setMessages((current) => [
        ...current,
        { id: `assistant-${Date.now()}`, role: 'assistant', text: mockAnswer(text) },
      ]);
      setThinking(false);
      scrollToEnd();
    }, 700);
  }

  function resetChat() {
    void Haptics.selectionAsync();
    setMessages(INITIAL_MESSAGES);
    setDraft('');
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}
        style={styles.keyboardView}>
        <View style={styles.header}>
          <View style={styles.brandMark}><Text style={styles.brandLetters}>IA</Text></View>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>ROBIA COPILOT</Text>
            <Text style={styles.headerTitle}>Bonjour, {firstName}</Text>
          </View>
          <Pressable accessibilityLabel="Nouvelle conversation" onPress={resetChat} style={styles.headerButton}>
            <MaterialIcons name="add-comment" size={20} color={Brand.navyDark} />
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messages}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={scrollToEnd}
          showsVerticalScrollIndicator={false}>
          <View style={styles.introCard}>
            <View pointerEvents="none" style={styles.introOrb} />
            <MaterialIcons name="android" size={22} color={Brand.tealDark} />
            <Text style={styles.introTitle}>Votre assistant marketing</Text>
            <Text style={styles.introText}>Des idées claires et des actions concrètes pour développer votre visibilité digitale.</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestions}>
            {SUGGESTIONS.map((item) => (
              <Pressable key={item.label} onPress={() => send(item.label)} style={styles.suggestion}>
                <MaterialIcons name={item.icon} size={18} color={Brand.tealDark} />
                <Text style={styles.suggestionText}>{item.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.thread}>
            {messages.map((message) => (
              <View key={message.id} style={[styles.messageRow, message.role === 'user' && styles.userRow]}>
                {message.role === 'assistant' ? (
                  <View style={styles.botAvatar}><Text style={styles.botAvatarText}>IA</Text></View>
                ) : null}
                <View style={[styles.bubble, message.role === 'user' ? styles.userBubble : styles.botBubble]}>
                  <Text style={[styles.messageText, message.role === 'user' && styles.userText]}>{message.text}</Text>
                </View>
              </View>
            ))}
            {thinking ? (
              <View style={styles.messageRow}>
                <View style={styles.botAvatar}><Text style={styles.botAvatarText}>IA</Text></View>
                <View style={[styles.botBubble, styles.thinkingBubble]}>
                  <ActivityIndicator size="small" color={Brand.tealDark} />
                  <Text style={styles.thinkingText}>RobIA réfléchit…</Text>
                </View>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View style={styles.composerWrap}>
          <View style={styles.composer}>
            <TextInput
              accessibilityLabel="Message à RobIA"
              multiline
              onChangeText={setDraft}
              onSubmitEditing={() => send()}
              placeholder="Demandez quelque chose…"
              placeholderTextColor={Brand.slate400}
              returnKeyType="send"
              style={styles.input}
              value={draft}
            />
            <Pressable
              accessibilityLabel="Envoyer"
              disabled={!draft.trim() || thinking}
              onPress={() => send()}
              style={[styles.sendButton, (!draft.trim() || thinking) && styles.sendDisabled]}>
              <MaterialIcons name="arrow-upward" size={21} color={Brand.white} />
            </Pressable>
          </View>
          <Text style={styles.prototype}>Mode prototype · les réponses peuvent être simulées</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FBFCFC' },
  keyboardView: { flex: 1 },
  header: { minHeight: 76, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 11 },
  brandMark: { width: 42, height: 42, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.tealLight },
  brandLetters: { color: Brand.tealDark, fontFamily: Fonts?.rounded, fontSize: 14, fontWeight: '900' },
  headerCopy: { flex: 1, gap: 1 },
  eyebrow: { color: Brand.tealDark, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  headerTitle: { color: Brand.navyDark, fontFamily: Fonts?.rounded, fontSize: 21, fontWeight: '900' },
  headerButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.white, borderWidth: 1, borderColor: Brand.slate200 },
  messages: { paddingHorizontal: 18, paddingBottom: 18 },
  introCard: { minHeight: 142, padding: 18, borderRadius: 25, overflow: 'hidden', justifyContent: 'flex-end', gap: 6, backgroundColor: Brand.tealLight },
  introOrb: { position: 'absolute', width: 150, height: 150, borderRadius: 75, right: -38, top: -72, backgroundColor: 'rgba(29,78,216,0.10)' },
  introTitle: { color: Brand.navyDark, fontFamily: Fonts?.rounded, fontSize: 22, fontWeight: '900' },
  introText: { maxWidth: '88%', color: Brand.slate500, fontSize: 13, lineHeight: 19 },
  suggestions: { paddingVertical: 14, gap: 9 },
  suggestion: { minHeight: 42, paddingHorizontal: 13, borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: Brand.white, borderWidth: 1, borderColor: Brand.slate200 },
  suggestionText: { color: Brand.navyDark, fontSize: 12, fontWeight: '700' },
  thread: { gap: 14, paddingTop: 3 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  userRow: { justifyContent: 'flex-end' },
  botAvatar: { width: 30, height: 30, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.navyDark },
  botAvatarText: { color: Brand.white, fontSize: 9, fontWeight: '900' },
  bubble: { maxWidth: '79%', paddingHorizontal: 14, paddingVertical: 11, borderRadius: 19 },
  botBubble: { backgroundColor: Brand.white, borderWidth: 1, borderColor: Brand.slate200, borderBottomLeftRadius: 6 },
  userBubble: { backgroundColor: Brand.teal, borderBottomRightRadius: 6 },
  messageText: { color: Brand.slate800, fontSize: 14, lineHeight: 20 },
  userText: { color: Brand.white },
  thinkingBubble: { minHeight: 44, paddingHorizontal: 14, borderRadius: 18, borderBottomLeftRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 8 },
  thinkingText: { color: Brand.slate500, fontSize: 12 },
  composerWrap: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, backgroundColor: '#FBFCFC' },
  composer: { minHeight: 54, maxHeight: 112, paddingLeft: 16, paddingRight: 6, borderRadius: 27, flexDirection: 'row', alignItems: 'center', backgroundColor: Brand.white, borderWidth: 1, borderColor: Brand.slate200 },
  input: { flex: 1, maxHeight: 92, paddingVertical: 13, color: Brand.slate800, fontSize: 14 },
  sendButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.teal },
  sendDisabled: { backgroundColor: Brand.slate200 },
  prototype: { paddingTop: 5, textAlign: 'center', color: Brand.slate400, fontSize: 9.5 },
});
