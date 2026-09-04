import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { PrimaryButton, RobiaCard, RobiaHeader, RobiaScreen, robiaStyles } from '@/components/robia-ui';
import { Brand, Fonts } from '@/constants/theme';
import { useRobiaData } from '@/src/api/data';
import { useSession } from '@/src/auth/session';

export default function AuditScreen() {
  const { organization, request, refreshOrganization } = useSession(); const { websites, runAudit } = useRobiaData();
  const [websiteUrl, setWebsiteUrl] = useState(websites[0]?.url ?? ''); const [city, setCity] = useState(organization?.city ?? ''); const [industry, setIndustry] = useState(organization?.sector ?? '');
  const [isRunning, setIsRunning] = useState(false); const [error, setError] = useState('');
  async function launchAudit() {
    if (!websiteUrl.trim() || isRunning) return; setIsRunning(true); setError('');
    try {
      await request('/organizations/current', { method: 'PATCH', body: { city: city.trim() || undefined, sector: industry.trim() || undefined } });
      await refreshOrganization(); await runAudit(websiteUrl); router.dismissTo('/(tabs)');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Impossible de lancer l’audit.'); }
    finally { setIsRunning(false); }
  }
  return <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><RobiaScreen>
    <RobiaHeader eyebrow="ANALYSE & DÉTECTION" title="Audit digital" subtitle="RobIA analyse votre site et transforme les résultats en opportunités prioritaires." />
    <RobiaCard style={styles.form} accent={Brand.teal}><LabeledInput icon="language" label="URL du site" placeholder="https://entreprise.com" value={websiteUrl} onChangeText={setWebsiteUrl} autoCapitalize="none" keyboardType="url" /><LabeledInput icon="location-on" label="Ville" placeholder="Paris" value={city} onChangeText={setCity} /><LabeledInput icon="storefront" label="Secteur d’activité" placeholder="Conseil, retail, restauration…" value={industry} onChangeText={setIndustry} /></RobiaCard>
    <View style={styles.notice}><MaterialIcons name="verified-user" size={21} color={Brand.tealDark} /><Text style={robiaStyles.body}>L’analyse peut prendre quelques instants. Aucune action n’est publiée automatiquement.</Text></View>
    {error ? <Text style={styles.error}>{error}</Text> : null}
    {isRunning ? <RobiaCard style={styles.loading}><ActivityIndicator color={Brand.teal} /><View style={styles.loadingCopy}><Text style={robiaStyles.cardTitle}>Audit en cours…</Text><Text style={robiaStyles.caption}>Exploration et analyse des pages de votre site.</Text></View></RobiaCard> : <PrimaryButton label="Lancer l’audit" icon="radar" disabled={!websiteUrl.trim()} onPress={() => void launchAudit()} />}
  </RobiaScreen></KeyboardAvoidingView>;
}
function LabeledInput({ label, icon, ...inputProps }: { label: string; icon: ComponentProps<typeof MaterialIcons>['name'] } & ComponentProps<typeof TextInput>) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><View style={styles.inputShell}><MaterialIcons name={icon} size={20} color={Brand.tealDark} /><TextInput placeholderTextColor={Brand.slate400} style={styles.input} {...inputProps} /></View></View>; }
const styles = StyleSheet.create({ flex: { flex: 1 }, form: { gap: 18 }, field: { gap: 8 }, label: { color: Brand.navyDark, fontFamily: Fonts?.sans, fontSize: 13, fontWeight: '800' }, inputShell: { minHeight: 52, paddingHorizontal: 14, borderRadius: 17, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Brand.slate50, borderWidth: 1, borderColor: Brand.slate200 }, input: { flex: 1, color: Brand.slate800, fontSize: 15 }, notice: { paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center', gap: 10 }, loading: { flexDirection: 'row', alignItems: 'center', gap: 14 }, loadingCopy: { gap: 2 }, error: { padding: 12, borderRadius: 14, color: Brand.orangeDark, backgroundColor: Brand.orangeLight, fontWeight: '700' } });
