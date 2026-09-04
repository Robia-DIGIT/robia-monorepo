import { Brand, Fonts } from "@/constants/theme";
import { ApiError } from "@/src/api/client";
import { useSession } from "@/src/auth/session";
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
  const { login, register } = useSession();
  const pager = useRef<PagerView>(null);
  const [page, setPage] = useState(0);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  function selectPage(next: number) {
    setPage(next);
    setError("");
    pager.current?.setPage(next);
  }
  async function submit(registration: boolean) {
    if (
      !email.trim() ||
      password.length < 8 ||
      (registration && (!name.trim() || !company.trim()))
    ) {
      setError(
        "Complétez les champs requis. Le mot de passe doit contenir au moins 8 caractères.",
      );
      return;
    }
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
      router.replace('/(tabs)/dashboard');
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Connexion impossible. Vérifiez votre réseau.",
      );
    } finally {
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
  };
  return (
    <SafeAreaView style={s.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={s.hero}>
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
        </View>
        <View style={s.sheet}>
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
            <View key="login" style={s.page}>
              <AuthPage registration={false} {...shared} />
            </View>
            <View key="register" style={s.page}>
              <AuthPage registration {...shared} />
            </View>
          </PagerView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type AuthPageProps = {
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
      contentContainerStyle={s.pageContent}
    >
      <View style={s.heading}>
        <View style={s.headingIcon}>
          <MaterialIcons
            name={registration ? "auto-awesome" : "waving-hand"}
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
  safeArea: { flex: 1, backgroundColor: "#EAF8F6" },
  flex: { flex: 1 },
  hero: {
    height: "34%",
    minHeight: 210,
    maxHeight: 295,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#EAF8F6",
  },
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
    width: 106,
    height: 74,
    marginBottom: 13,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.88)",
    shadowColor: Brand.navyDark,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 22,
    elevation: 5,
  },
  logo: { width: 78, height: 50 },
  heroTitle: {
    color: Brand.navyDark,
    fontFamily: Fonts?.rounded,
    fontSize: 18,
    fontWeight: "900",
  },
  heroSubtitle: {
    marginTop: 5,
    color: Brand.tealDark,
    fontSize: 12,
    fontWeight: "700",
  },
  sheet: {
    flex: 1,
    marginTop: -12,
    paddingTop: 12,
    overflow: "hidden",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    backgroundColor: Brand.white,
    shadowColor: Brand.navyDark,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 12,
  },
  handle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    marginBottom: 16,
    borderRadius: 2,
    backgroundColor: Brand.slate200,
  },
  modeSwitch: {
    marginHorizontal: 24,
    flexDirection: "row",
    padding: 4,
    borderRadius: 16,
    backgroundColor: Brand.slate100,
  },
  modeButton: {
    flex: 1,
    minHeight: 39,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  modeButtonActive: { backgroundColor: Brand.white, elevation: 2 },
  modeLabel: { color: Brand.slate400, fontSize: 12, fontWeight: "800" },
  modeLabelActive: { color: Brand.navyDark },
  pager: { flex: 1 },
  page: { flex: 1 },
  pageContent: { paddingHorizontal: 24, paddingTop: 22, paddingBottom: 26 },
  heading: {
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
  subtitle: { color: Brand.slate500, fontSize: 12.5, lineHeight: 18 },
  form: { gap: 15 },
  fieldGroup: { gap: 7 },
  fieldLabel: { color: Brand.slate500, fontSize: 11, fontWeight: "800" },
  field: {
    minHeight: 52,
    paddingHorizontal: 14,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Brand.slate50,
    borderWidth: 1,
    borderColor: Brand.slate200,
  },
  input: {
    flex: 1,
    minHeight: 50,
    paddingVertical: 0,
    color: Brand.slate800,
    fontSize: 14,
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
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },
  submit: {
    minHeight: 56,
    marginTop: 19,
    paddingLeft: 20,
    paddingRight: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Brand.navyDark,
  },
  submitText: { color: Brand.white, fontSize: 14, fontWeight: "800" },
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
    fontSize: 9.5,
    lineHeight: 14,
    textAlign: "center",
  },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.56 },
});
