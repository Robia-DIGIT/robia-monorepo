import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Brand, Fonts } from '@/constants/theme';
import { ApiError } from '@/src/api/client';
import { useSession } from '@/src/auth/session';

export default function AuthScreen() {
  const { login, register } = useSession();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState(''); const [company, setCompany] = useState('');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); const [error, setError] = useState('');
  const isRegister = mode === 'register';

  async function submit() {
    if (!email.trim() || password.length < 8 || (isRegister && (!name.trim() || !company.trim()))) {
      setError('Complétez les champs requis. Le mot de passe doit contenir au moins 8 caractères.'); return;
    }
    setIsSubmitting(true); setError('');
    try {
      if (isRegister) await register({ name: name.trim(), company: company.trim(), email, password });
      else await login(email, password);
      router.replace('/(tabs)');
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Connexion impossible. Vérifiez votre réseau.'); }
    finally { setIsSubmitting(false); }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Image source={require('@/assets/images/logo-robia-copilot.svg')} contentFit="contain" style={styles.logo} />
          <Text style={styles.eyebrow}>ESPACE ENTREPRISE</Text>
          <Text style={styles.title}>{isRegister ? 'Créer votre espace' : 'Heureux de vous revoir'}</Text>
          <Text style={styles.subtitle}>{isRegister ? 'Configurez votre compte RobIA Copilot.' : 'Connectez-vous pour piloter votre visibilité.'}</Text>
        </View>
        <View style={styles.form}>
          {isRegister ? <Field icon="person-outline" placeholder="Nom complet" value={name} onChangeText={setName} /> : null}
          {isRegister ? <Field icon="business" placeholder="Entreprise" value={company} onChangeText={setCompany} /> : null}
          <Field icon="mail-outline" placeholder="Email professionnel" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Field icon="lock-outline" placeholder="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry />
          {error ? <View style={styles.error}><MaterialIcons name="error-outline" size={18} color={Brand.orangeDark} /><Text style={styles.errorText}>{error}</Text></View> : null}
          <Pressable disabled={isSubmitting} onPress={submit} style={({ pressed }) => [styles.submit, pressed && styles.pressed, isSubmitting && styles.disabled]}>
            {isSubmitting ? <ActivityIndicator color={Brand.white} /> : <><Text style={styles.submitText}>{isRegister ? 'Créer mon espace' : 'Se connecter'}</Text><MaterialIcons name="arrow-forward" size={19} color={Brand.white} /></>}
          </Pressable>
        </View>
        <Pressable onPress={() => { setMode(isRegister ? 'login' : 'register'); setError(''); }} style={styles.switchButton}>
          <Text style={styles.switchText}>{isRegister ? 'Déjà un compte ? Se connecter' : 'Nouveau sur RobIA ? Créer un compte'}</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field(props: React.ComponentProps<typeof TextInput> & { icon: React.ComponentProps<typeof MaterialIcons>['name'] }) {
  const { icon, ...inputProps } = props;
  return <View style={styles.field}><MaterialIcons name={icon} size={20} color={Brand.tealDark} /><TextInput placeholderTextColor={Brand.slate400} style={styles.input} {...inputProps} /></View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Brand.slate50 }, screen: { flex: 1, justifyContent: 'center', padding: 24, gap: 24 },
  header: { gap: 7 }, logo: { width: 76, height: 48, marginBottom: 16 }, eyebrow: { color: Brand.tealDark, fontSize: 11, fontWeight: '800', letterSpacing: 1.3 },
  title: { color: Brand.navyDark, fontFamily: Fonts?.rounded, fontSize: 31, lineHeight: 37, fontWeight: '900' }, subtitle: { color: Brand.slate500, fontSize: 14, lineHeight: 21 },
  form: { padding: 18, gap: 13, borderRadius: 26, backgroundColor: Brand.white, borderWidth: 1, borderColor: Brand.slate200 },
  field: { minHeight: 54, paddingHorizontal: 14, borderRadius: 17, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Brand.slate50, borderWidth: 1, borderColor: Brand.slate200 }, input: { flex: 1, color: Brand.slate800, fontSize: 15 },
  error: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 11, borderRadius: 14, backgroundColor: Brand.orangeLight }, errorText: { flex: 1, color: Brand.orangeDark, fontSize: 12, lineHeight: 17, fontWeight: '600' },
  submit: { minHeight: 54, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: Brand.teal }, submitText: { color: Brand.white, fontSize: 15, fontWeight: '800' },
  switchButton: { alignItems: 'center', padding: 10 }, switchText: { color: Brand.tealDark, fontSize: 13, fontWeight: '700' }, pressed: { opacity: 0.76, transform: [{ scale: 0.98 }] }, disabled: { opacity: 0.55 },
});
