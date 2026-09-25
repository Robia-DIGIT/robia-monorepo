import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useKeyboardVisible } from '@/hooks/use-keyboard-visible';
import { Brand, Fonts } from "@/constants/theme";
import { ApiError } from "@/src/api/client";
import { useSession } from "@/src/auth/session";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useRef, useState, type ReactNode } from "react";
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
} from "react-native";
import PagerView from "react-native-pager-view";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AuthScreen() {
  const layout = useResponsiveLayout();
  const keyboardVisible = useKeyboardVisible();
  const reduceMotion = useReducedMotion();
  const { login, register, sessionError, restore } = useSession();
  const pager = useRef<PagerView>(null);
  const [page, setPage] = useState(0);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const submitLock = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const compact = layout.safeHeight < 700;
  function selectPage(next: number) {
    setPage(next);
    setError("");
    if (reduceMotion) pager.current?.setPageWithoutAnimation(next);
    else pager.current?.setPage(next);
  }
  async function submit(registration: boolean) {
    if (submitLock.current) return;
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      (registration ? password.length < 8 : !password) ||
      (registration && (name.trim().length < 2 || !company.trim()))
    ) {
      setError(
        "Complétez les champs requis. Le mot de passe doit contenir au moins 8 caractères.",
      );
      return;
    }
    submitLock.current = true;
    setIsSubmitting(true);
    setError("");
    try {
      if (registration)
        await register({
          name: name.trim(),
          company: company.trim(),
          email,
          password,
        });
      else await login(email, password);
      router.replace("/(tabs)/dashboard");
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Connexion impossible. Vérifiez votre réseau.",
      );
    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  }
  const shared = {
    name,
    company,
    email,
    password,
    showPassword,
    isSubmitting,
    error,
    setName,
    setCompany,
    setEmail,
    setPassword,
    setShowPassword,
    submit,
    sessionNotice: sessionError ? <Pressable accessibilityRole="button" onPress={() => void restore()} style={{ minHeight: 48, justifyContent: 'center' }}>
      <Text accessibilityRole="alert" style={s.errorText}>{sessionError} · Réessayer</Text>
    </Pressable> : null,
  };
  return (
    <SafeAreaView style={s.safeArea} edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {!keyboardVisible && !layout.short && layout.fontScale < 1.4 ? <View style={[s.hero, compact && s.heroCompact]}>
          {/* <Pressable accessibilityRole="button" accessibilityLabel="Retour" hitSlop={8} onPress={() => router.back()} style={({ pressed }) => [s.backButton, pressed && s.pressed]}>
            <MaterialIcons name="arrow-back" size={21} color={Brand.navyDark} />
          </Pressable> */}
          <View style={s.brandMark}>
            <Image
              source={require("@/assets/images/logo-robia-copilot.svg")}
              contentFit="contain"
              style={s.logo}
              accessibilityLabel="RobIA Copilot"
            />
          </View>
          <Text style={s.heroTitle}>Votre croissance, guidée par l’IA</Text>
          <Text style={s.heroSubtitle}>Analysez. Décidez. Agissez.</Text>
        </View> : null}
        <View style={[s.sheet, { width: Math.min(620, layout.safeWidth - layout.gutter * 2) }]}>
          <View style={s.handle} />
          <View style={s.modeSwitch}>
            <ModeButton
              label="Connexion"
              active={page === 0}
              onPress={() => selectPage(0)}
            />
            <ModeButton
              label="Inscription"
              active={page === 1}
              onPress={() => selectPage(1)}
            />
          </View>
          <PagerView
            ref={pager}
            style={s.pager}
            initialPage={0}
            overdrag
            onPageSelected={(event) => {
              setPage(event.nativeEvent.position);
              setError("");
            }}
          >
            <View key="login" style={s.page} accessibilityElementsHidden={page !== 0} importantForAccessibility={page === 0 ? 'auto' : 'no-hide-descendants'}>
              <AuthPage registration={false} {...shared} />
            </View>
            <View key="register" style={s.page} accessibilityElementsHidden={page !== 1} importantForAccessibility={page === 1 ? 'auto' : 'no-hide-descendants'}>
              <AuthPage registration {...shared} />
            </View>
          </PagerView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type AuthPageProps = {
  sessionNotice: ReactNode;
  registration: boolean;
  name: string;
  company: string;
  email: string;
  password: string;
  showPassword: boolean;
  isSubmitting: boolean;
  error: string;
  setName(value: string): void;
  setCompany(value: string): void;
  setEmail(value: string): void;
  setPassword(value: string): void;
  setShowPassword(value: boolean | ((current: boolean) => boolean)): void;
  submit(registration: boolean): Promise<void>;
};
function AuthPage({
  sessionNotice,
  registration,
  name,
  company,
  email,
  password,
  showPassword,
  isSubmitting,
  error,
  setName,
  setCompany,
  setEmail,
  setPassword,
  setShowPassword,
  submit,
}: AuthPageProps) {
  return (
    <ScrollView
      bounces={false}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      keyboardDismissMode="on-drag"
      contentContainerStyle={s.pageContent}
    >
      {sessionNotice}
      <View style={s.heading}>
        <View style={s.headingIcon}>
          <MaterialIcons
            name={registration ? "waving-hand" : "waving-hand"}
            size={18}
            color={Brand.tealDark}
          />
        </View>
        <View style={s.headingCopy}>
          <Text style={s.title}>
            {registration ? "Créez votre espace" : "Bienvenue sur RobIA"}
          </Text>
          <Text style={s.subtitle}>
            {registration
              ? "Commencez à piloter votre visibilité digitale."
              : "Retrouvez vos analyses et actions marketing."}
          </Text>
        </View>
      </View>
      <View style={s.form}>
        {registration ? (
          <Field
            icon="person-outline"
            label="Nom complet"
            placeholder="Votre nom"
            value={name}
            onChangeText={setName}
          />
        ) : null}
        {registration ? (
          <Field
            icon="business"
            label="Entreprise"
            placeholder="Nom de votre entreprise"
            value={company}
            onChangeText={setCompany}
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
          autoComplete="email"
        />
        <Field
          icon="lock-outline"
          label="Mot de passe"
          placeholder="8 caractères minimum"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoComplete={registration ? "new-password" : "current-password"}
          returnKeyType="done"
          onSubmitEditing={() => void submit(registration)}
          right={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                showPassword
                  ? "Masquer le mot de passe"
                  : "Afficher le mot de passe"
              }
              hitSlop={10}
              style={{ minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => setShowPassword((current) => !current)}
            >
              <MaterialIcons
                name={showPassword ? "visibility-off" : "visibility"}
                size={20}
                color={Brand.slate400}
              />
            </Pressable>
          }
        />
      </View>
      {error ? (
        <View style={s.error} accessibilityRole="alert">
          <MaterialIcons
            name="error-outline"
            size={18}
            color={Brand.orangeDark}
          />
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={registration ? "Créer mon espace RobIA" : "Continuer avec RobIA"}
        accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
        disabled={isSubmitting}
        onPress={() => void submit(registration)}
        style={({ pressed }) => [
          s.submit,
          pressed && s.pressed,
          isSubmitting && s.disabled,
        ]}
      >
        {isSubmitting ? (
          <ActivityIndicator color={Brand.white} />
        ) : (
          <>
            <Text style={s.submitText}>
              {registration ? "Créer mon espace RobIA" : "Continuer avec RobIA"}
            </Text>
            <View style={s.submitIcon}>
              <MaterialIcons
                name="arrow-forward"
                size={18}
                color={Brand.navyDark}
              />
            </View>
          </>
        )}
      </Pressable>
      {!registration ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/password")}
          style={{ minHeight: 44, justifyContent: "center" }}
        >
          <Text style={{ color: Brand.tealDark, textAlign: "center" }}>
            Mot de passe oublié ?
          </Text>
        </Pressable>
      ) : null}
      <Text style={s.legal}>
        En continuant, vous acceptez les conditions d’utilisation et la
        politique de confidentialité de RobIA.
      </Text>
    </ScrollView>
  );
}
function ModeButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress(): void;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[s.modeButton, active && s.modeButtonActive]}
    >
      <Text style={[s.modeLabel, active && s.modeLabelActive]}>{label}</Text>
    </Pressable>
  );
}
function Field({
  icon,
  label,
  right,
  ...props
}: React.ComponentProps<typeof TextInput> & {
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  label: string;
  right?: ReactNode;
}) {
  return (
    <View style={s.fieldGroup}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={s.field}>
        <MaterialIcons name={icon} size={20} color={Brand.tealDark} />
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={Brand.slate400}
          style={s.input}
          {...props}
        />
        {right}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Brand.slate50 },
  flex: { flex: 1 },
  backButton: {
    position: "absolute",
    left: 20,
    top: 10,
    zIndex: 2,
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.white,
    borderWidth: 0,
  },
  hero: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    minHeight: 164,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: Brand.slate50,
  },
  heroCompact: { minHeight: 126, paddingVertical: 12 },
  orb: { position: "absolute", borderRadius: 999, opacity: 0.7 },
  orbTeal: {
    width: 190,
    height: 190,
    right: -70,
    top: -62,
    backgroundColor: Brand.tealLight,
  },
  orbBlue: {
    width: 150,
    height: 150,
    left: -58,
    bottom: -72,
    backgroundColor: Brand.electricLight,
  },
  orbOrange: {
    width: 58,
    height: 58,
    right: 44,
    bottom: 25,
    backgroundColor: Brand.orangeLight,
    opacity: 0.55,
  },
  brandMark: {
    width: 100,
    height: 58,
    marginBottom: 8,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: 78, height: 50 },
  heroTitle: {
    textAlign: "center",
    color: Brand.navyDark,
    fontFamily: Fonts?.rounded,
    fontSize: 18,
    fontWeight: "900",
  },
  heroSubtitle: {
    textAlign: "center",
    marginTop: 5,
    color: Brand.tealDark,
    fontSize: 14,
    fontWeight: "700",
  },
  sheet: {
    flex: 1,
    alignSelf: "center",
    marginBottom: 8,
    paddingTop: 10,
    overflow: "hidden",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: Brand.white,
    shadowColor: Brand.navyDark,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.045,
    shadowRadius: 24,
    elevation: 5,
  },
  sheetWide: { width: "100%", maxWidth: 620, alignSelf: "center" },
  handle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    marginBottom: 16,
    borderRadius: 2,
    backgroundColor: Brand.slate200,
  },
  modeSwitch: {
    marginHorizontal: 18,
    flexDirection: "row",
    padding: 4,
    borderRadius: 16,
    backgroundColor: Brand.slate100,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    minHeight: 48,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  modeButtonActive: { backgroundColor: Brand.white, elevation: 2 },
  modeLabel: { textAlign: "center", flexShrink: 1, color: Brand.slate400, fontSize: 14, fontWeight: "800" },
  modeLabelActive: { color: Brand.navyDark },
  pager: { flex: 1 },
  page: { flex: 1 },
  pageContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 28 },
  heading: {
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  headingIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.tealLight,
  },
  headingCopy: { flex: 1, gap: 4 },
  title: {
    color: Brand.navyDark,
    fontFamily: Fonts?.rounded,
    fontSize: 23,
    lineHeight: 28,
    fontWeight: "900",
  },
  subtitle: { color: Brand.slate500, fontSize: 14, lineHeight: 20 },
  form: { width: "100%", maxWidth: 560, alignSelf: "center", gap: 14 },
  fieldGroup: { gap: 7 },
  fieldLabel: { color: Brand.navyDark, fontSize: 13, fontWeight: "800" },
  field: {
    minHeight: 54,
    paddingHorizontal: 14,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Brand.slate50,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Brand.borderSubtle,
  },
  input: {
    flex: 1,
    minHeight: 50,
    paddingVertical: 12,
    minWidth: 0,
    color: Brand.slate800,
    fontSize: 16,
  },
  error: {
    marginTop: 15,
    padding: 11,
    borderRadius: 14,
    flexDirection: "row",
    gap: 8,
    backgroundColor: Brand.orangeLight,
  },
  errorText: {
    flex: 1,
    color: Brand.orangeDark,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  submit: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    minHeight: 56,
    marginTop: 19,
    paddingVertical: 8,
    gap: 12,
    paddingLeft: 20,
    paddingRight: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Brand.navyDark,
  },
  submitText: {
    flex: 1,
    flexShrink: 1,
    color: Brand.white,
    fontFamily: Fonts?.sans,
    fontSize: 14,
    fontWeight: "800",
  },
  submitIcon: {
    width: 40,
    height: 40,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.tealLight,
  },
  legal: {
    maxWidth: 330,
    alignSelf: "center",
    marginTop: 14,
    color: Brand.slate400,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.56 },
});
