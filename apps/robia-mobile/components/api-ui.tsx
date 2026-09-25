import { robiaStyles } from '@/components/robia-ui';
import { Brand } from '@/constants/theme';
import { useRef, useState, type ComponentProps } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
export function Field({ label, ...props }: ComponentProps<typeof TextInput> & { label: string }) {
  return <View style={{ gap: 6, minWidth: 0, maxWidth: '100%' }}><Text style={robiaStyles.body}>{label}</Text><TextInput accessibilityLabel={label} placeholderTextColor={Brand.slate400} {...props} style={[s.input, props.multiline && { minHeight: 120, textAlignVertical: 'top' }, props.style]} /></View>;
}
export function AsyncButton({ label, action, disabled = false, confirm, onSuccess }: { label: string; action(): Promise<unknown>; disabled?: boolean; confirm?: string; onSuccess?: string }) {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  async function run() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(null); setMessage(null);
    try { await action(); if (onSuccess) setMessage(onSuccess); }
    catch (e) { setError(e instanceof Error ? e.message : 'Action impossible. Réessayez.'); }
    finally { lock.current = false; setBusy(false); }
  }
  return <View style={{ gap: 6, minWidth: 0, maxWidth: '100%' }}>
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: disabled || busy, busy }} disabled={disabled || busy}
      onPress={() => {
        if (!confirm) { void run(); return; }
        if (Platform.OS === 'web') { if (globalThis.confirm(confirm)) void run(); return; }
        Alert.alert(label, confirm, [{ text: 'Annuler', style: 'cancel' }, { text: 'Confirmer', onPress: () => void run() }]);
      }}
      accessibilityLabel={label}
      style={({ pressed }) => [s.button, (pressed || disabled || busy) && { opacity: 0.5 }]}>
      {busy ? <ActivityIndicator color="white" /> : <Text style={s.buttonText}>{label}</Text>}
    </Pressable>
    {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
    {message ? <Text accessibilityLiveRegion="polite" style={robiaStyles.body}>{message}</Text> : null}
  </View>;
}
export function LoadState({ loading, error, retry, empty }: { loading: boolean; error: string | null; retry(): Promise<unknown>; empty?: boolean }) {
  return <View style={{ gap: 8 }}>{loading ? <ActivityIndicator accessibilityLabel="Chargement" color={Brand.teal} /> : null}
    {error ? <><Text accessibilityRole="alert" style={s.error}>{error}</Text><AsyncButton label="Réessayer" action={retry} /></> : null}
    {!loading && !error && empty ? <Text style={robiaStyles.body}>Aucun élément pour le moment.</Text> : null}</View>;
}
export function Choices<T extends string>({ value, options, onChange }: { value: T; options: readonly { value: T; label: string }[]; onChange(value: T): void }) {
  return <View style={s.choices}>{options.map(o => <Pressable key={o.value} accessibilityRole="button" accessibilityState={{ selected: o.value === value }} onPress={() => onChange(o.value)} style={[s.choice, o.value === value && s.selected]}><Text style={{ color: o.value === value ? Brand.tealDark : Brand.slate500 }}>{o.label}</Text></Pressable>)}</View>;
}
export const apiStyles = StyleSheet.create({ stack: { gap: 14 }, title: robiaStyles.cardTitle, body: robiaStyles.body });
const s = StyleSheet.create({
  input: { width: '100%', minWidth: 0, minHeight: 52, padding: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: Brand.borderSubtle, borderRadius: 8, backgroundColor: Brand.slate50, color: Brand.navyDark, fontSize: 16 },
  button: { minHeight: 52, padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.tealDark },
  buttonText: { textAlign: 'center', flexShrink: 1, color: 'white', fontWeight: '700', fontSize: 15 }, error: { color: '#9F2D20', lineHeight: 21 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, choice: { maxWidth: '100%', flexShrink: 1, minHeight: 48, padding: 12, borderRadius: 8, backgroundColor: Brand.slate100, justifyContent: 'center' }, selected: { backgroundColor: Brand.tealLight },
});
