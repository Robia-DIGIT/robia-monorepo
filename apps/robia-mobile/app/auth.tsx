import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInLeft, FadeInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, Fonts } from '@/constants/theme';
import { ApiError } from '@/src/api/client';
import { useSession } from '@/src/auth/session';

export default function AuthScreen() {
  const { login, register } = useSession();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const isRegister = mode === 'register';

  const swipeGesture = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 14 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.4,
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx < -48 && mode === 'login') changeMode('register');
          if (gesture.dx > 48 && mode === 'register') changeMode('login');
        },
      }),
    [mode],
  );

  function changeMode(nextMode: 'login' | 'register') {
    setMode(nextMode);
    setError('');
  }

  async function submit() {
    if (!email.trim() || password.length < 8 || (isRegister && (!name.trim() || !company.trim()))) {
      setError('Complétez les champs requis. Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      if (isRegister) {
        await register({ name: name.trim(), company: company.trim(), email, password });
      } else {
        await login(email, password);
      }
      router.replace('/(tabs)');
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Connexion impossible. Vérifiez votre réseau.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.hero}>
          <View pointerEvents="none" style={[styles.orb, styles.orbTeal]} />
          <View pointerEvents="none" style={[styles.orb, styles.orbBlue]} />
          <View pointerEvents="none" style={[styles.orb, styles.orbOrange]} />
          <View style={styles.brandMark}>
            <Image
              source={require('@/assets/images/logo-robia-copilot.svg')}
              contentFit="contain"
              style={styles.logo}
              accessibilityLabel="RobIA Copilot"
            />
          </View>
          <Text style={styles.heroTitle}>Votre croissance, guidée par l’IA</Text>
          <Text style={styles.heroSubtitle}>Analysez. Décidez. Agissez.</Text>
        </View>

        <View style={styles.sheet} {...swipeGesture.panHandlers}>
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetContent}>
            <Animated.View
              key={mode}
              entering={(isRegister ? FadeInRight : FadeInLeft).duration(260)}>
            <View style={styles.handle} />

            <View style={styles.modeSwitch} accessibilityRole="tablist">
              <ModeButton label="Connexion" active={!isRegister} onPress={() => changeMode('login')} />
              <ModeButton label="Inscription" active={isRegister} onPress={() => changeMode('register')} />
            </View>

            <View style={styles.heading}>
              <View style={styles.headingIcon}>
                <MaterialIcons name={isRegister ? 'waving-hand' : 'waving-hand'} size={18} color={Brand.tealDark} />
              </View>
              <View style={styles.headingCopy}>
                <Text style={styles.title}>{isRegister ? 'Créez votre espace' : 'Bienvenue sur RobIA'}</Text>
                <Text style={styles.subtitle}>
                  {isRegister
                    ? 'Commencez à piloter votre visibilité digitale.'
                    : 'Retrouvez vos analyses et actions marketing.'}
                </Text>
              </View>
            </View>

            <View style={styles.form}>
              {isRegister ? (
                <Field
                  icon="person-outline"
                  label="Nom complet"
                  placeholder="Votre nom"
                  value={name}
                  onChangeText={setName}
                  textContentType="name"
                  autoComplete="name"
                />
              ) : null}
              {isRegister ? (
                <Field
                  icon="business"
                  label="Entreprise"
                  placeholder="Nom de votre entreprise"
                  value={company}
                  onChangeText={setCompany}
                  textContentType="organizationName"
                />
              ) : null}
              <Field
                icon="mail-outline"
                label="Email professionnel"
                placeholder="vous@entreprise.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                autoComplete="email"
              />
              <Field
                icon="lock-outline"
                label="Mot de passe"
                placeholder="8 caractères minimum"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                textContentType={isRegister ? 'newPassword' : 'password'}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                returnKeyType="done"
                onSubmitEditing={() => void submit()}
                right={
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    hitSlop={10}
                    onPress={() => setShowPassword((current) => !current)}>
                    <MaterialIcons
                      name={showPassword ? 'visibility-off' : 'visibility'}
                      size={20}
                      color={Brand.slate400}
                    />
                  </Pressable>
                }
              />
            </View>

            {error ? (
              <View style={styles.error} accessibilityRole="alert">
                <MaterialIcons name="error-outline" size={18} color={Brand.orangeDark} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: isSubmitting }}
              disabled={isSubmitting}
              onPress={() => void submit()}
              style={({ pressed }) => [
                styles.submit,
                pressed && styles.pressed,
                isSubmitting && styles.disabled,
              ]}>
              {isSubmitting ? (
                <ActivityIndicator color={Brand.white} />
              ) : (
                <>
                  <Text style={styles.submitText}>
                    {isRegister ? 'Créer mon espace RobIA' : 'Continuer avec RobIA'}
                  </Text>
                  <View style={styles.submitIcon}>
                    <MaterialIcons name="arrow-forward" size={18} color={Brand.navyDark} />
                  </View>
                </>
              )}
            </Pressable>

            <Text style={styles.legal}>
              En continuant, vous acceptez les conditions d’utilisation et la politique de confidentialité de RobIA.
            </Text>
            </Animated.View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ModeButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.modeButton, active && styles.modeButtonActive]}>
      <Text style={[styles.modeLabel, active && styles.modeLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function Field({
  icon,
  label,
  right,
  ...inputProps
}: React.ComponentProps<typeof TextInput> & {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  right?: ReactNode;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.field}>
        <MaterialIcons name={icon} size={20} color={Brand.tealDark} />
        <TextInput placeholderTextColor={Brand.slate400} style={styles.input} {...inputProps} />
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#EAF8F6' },
  keyboardView: { flex: 1 },
  hero: {
    height: '34%',
    minHeight: 210,
    maxHeight: 295,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#EAF8F6',
  },
  orb: { position: 'absolute', borderRadius: 999, opacity: 0.7 },
  orbTeal: { width: 190, height: 190, right: -70, top: -62, backgroundColor: Brand.tealLight },
  orbBlue: { width: 150, height: 150, left: -58, bottom: -72, backgroundColor: Brand.electricLight },
  orbOrange: { width: 58, height: 58, right: 44, bottom: 25, backgroundColor: Brand.orangeLight, opacity: 0.55 },
  brandMark: {
    width: 106,
    height: 74,
    marginBottom: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 78, height: 50 },
  heroTitle: { color: Brand.navyDark, fontFamily: Fonts?.rounded, fontSize: 18, fontWeight: '900' },
  heroSubtitle: { marginTop: 5, color: Brand.tealDark, fontFamily: Fonts?.sans, fontSize: 12, fontWeight: '700', letterSpacing: 0.25 },
  sheet: {
    flex: 1,
    marginTop: -12,
    overflow: 'hidden',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    backgroundColor: Brand.white,
    shadowColor: Brand.navyDark,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 12,
  },
  sheetContent: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 26 },
  handle: { alignSelf: 'center', width: 42, height: 4, marginBottom: 16, borderRadius: 2, backgroundColor: Brand.slate200 },
  modeSwitch: { flexDirection: 'row', padding: 4, borderRadius: 16, backgroundColor: Brand.slate100 },
  modeButton: { flex: 1, minHeight: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  modeButtonActive: { backgroundColor: Brand.white, shadowColor: Brand.navyDark, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  modeLabel: { color: Brand.slate400, fontFamily: Fonts?.sans, fontSize: 12, fontWeight: '800' },
  modeLabelActive: { color: Brand.navyDark },
  heading: { marginTop: 22, marginBottom: 20, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  headingIcon: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.tealLight },
  headingCopy: { flex: 1, gap: 4 },
  title: { color: Brand.navyDark, fontFamily: Fonts?.rounded, fontSize: 23, lineHeight: 28, fontWeight: '900', letterSpacing: -0.35 },
  subtitle: { color: Brand.slate500, fontFamily: Fonts?.sans, fontSize: 12.5, lineHeight: 18 },
  form: { gap: 15 },
  fieldGroup: { gap: 7 },
  fieldLabel: { color: Brand.slate500, fontFamily: Fonts?.sans, fontSize: 11, fontWeight: '800' },
  field: { minHeight: 52, paddingHorizontal: 14, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Brand.slate50, borderWidth: 1, borderColor: Brand.slate200 },
  input: { flex: 1, minHeight: 50, paddingVertical: 0, color: Brand.slate800, fontFamily: Fonts?.sans, fontSize: 14 },
  error: { marginTop: 15, padding: 11, borderRadius: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: Brand.orangeLight },
  errorText: { flex: 1, color: Brand.orangeDark, fontSize: 12, lineHeight: 17, fontWeight: '600' },
  submit: { minHeight: 56, marginTop: 19, paddingLeft: 20, paddingRight: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Brand.navyDark },
  submitText: { color: Brand.white, fontFamily: Fonts?.sans, fontSize: 14, fontWeight: '800' },
  submitIcon: { width: 40, height: 40, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.tealLight },
  legal: { maxWidth: 330, alignSelf: 'center', marginTop: 14, color: Brand.slate400, fontFamily: Fonts?.sans, fontSize: 9.5, lineHeight: 14, textAlign: 'center' },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.56 },
});
