import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Children, type PropsWithChildren, type ReactNode } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Brand, Fonts } from "@/constants/theme";

type IconName = React.ComponentProps<typeof MaterialIcons>["name"];

export function RobiaScreen({
  children,
  scroll = true,
  contentStyle,
  fixedHeader = false,
  refreshing = false,
  onRefresh,
}: PropsWithChildren<{
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  fixedHeader?: boolean;
  refreshing?: boolean;
  onRefresh?: () => Promise<unknown>;
}>) {
  const items = Children.toArray(children);
  const header = fixedHeader ? items.shift() : null;
  const content = (
    <View
      style={[
        styles.screenContent,
        fixedHeader && styles.screenContentBelowHeader,
        contentStyle,
      ]}
    >
      {items}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View pointerEvents="none" style={styles.ambientTop} />
      <View pointerEvents="none" style={styles.ambientSide} />
      {header ? (
        <View style={styles.fixedHeader}>
          <View style={styles.fixedHeaderInner}>{header}</View>
        </View>
      ) : null}
      {scroll ? (
        <ScrollView
          accessibilityRole={'none'}
          style={styles.scroll}
          refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={Brand.tealDark} /> : undefined}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}
export function RobiaHeader({
  title,
  subtitle,
  eyebrow,
  action,
  back = false,
  compact = false,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  action?: ReactNode;
  back?: boolean;
  compact?: boolean;
}) {
  return (
    <View style={[styles.header, compact && styles.headerCompact]}>
      <View style={[styles.brandRow, compact && styles.brandRowCompact]}>
        {back ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Revenir à l’écran précédent"
            hitSlop={8}
            onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
            style={({ pressed }) => [
              styles.headerButton,
              pressed && styles.pressed,
            ]}
          >
            <MaterialIcons name="arrow-back" size={21} color={Brand.navyDark} />
          </Pressable>
        ) : (
          <Image
            source={require("@/assets/images/logo-robia-copilot.svg")}
            contentFit="contain"
            style={[styles.logo, compact && styles.logoCompact]}
            accessibilityLabel="Logo RobIA Copilot"
          />
        )}
        {back || compact ? (
          <View pointerEvents="none" style={styles.navigationTitleGroup}>
            <Text accessibilityRole={'header'} style={styles.navigationTitle} numberOfLines={2}>
              {title}
            </Text>
          </View>
        ) : null}
        <View style={styles.headerActions}>{action}</View>
      </View>
      {!compact && eyebrow ? (
        <Text style={styles.eyebrow}>{eyebrow}</Text>
      ) : null}
      {!back && !compact ? <Text accessibilityRole={'header'} style={styles.title}>{title}</Text> : null}
      {!compact && subtitle ? (
        <Text style={[styles.subtitle, back && styles.subtitleAfterNavigation]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
export function RobiaCard({
  children,
  style,
  accent,
  variant = "surface",
}: PropsWithChildren<{ style?: StyleProp<ViewStyle>; accent?: string; variant?: "surface" | "plain" }>) {
  return (
    <View
      style={[
        styles.card,
        accent ? { borderLeftColor: accent, borderLeftWidth: 2 } : null,
        variant === "plain" && styles.plainSection,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function IconBadge({
  name,
  color = Brand.tealDark,
  backgroundColor = Brand.tealLight,
  size = 20,
}: {
  name: IconName;
  color?: string;
  backgroundColor?: string;
  size?: number;
}) {
  return (
    <View style={[styles.iconBadge, { backgroundColor }]}>
      <MaterialIcons name={name} size={size} color={color} />
    </View>
  );
}

export function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action}
    </View>
  );
}

export function StatusPill({
  label,
  tone = "teal",
}: {
  label: string;
  tone?: "teal" | "orange" | "navy" | "neutral";
}) {
  const tones = {
    teal: { backgroundColor: Brand.tealLight, color: Brand.tealDark },
    orange: { backgroundColor: Brand.orangeLight, color: Brand.orangeDark },
    navy: { backgroundColor: Brand.electricLight, color: Brand.electricDark },
    neutral: { backgroundColor: Brand.slate100, color: Brand.slate500 },
  };

  return (
    <View
      accessible
      accessibilityLabel={'Statut : ' + label}
      style={[styles.pill, { backgroundColor: tones[tone].backgroundColor }]}
    >
      <Text style={[styles.pillText, { color: tones[tone].color }]}>
        {label}
      </Text>
    </View>
  );
}

export function PrimaryButton({
  label,
  icon = "arrow-forward",
  onPress,
  disabled,
}: {
  label: string;
  icon?: IconName;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.primaryButtonLabel}>{label}</Text>
      <MaterialIcons name={icon} size={19} color={Brand.white} />
    </Pressable>
  );
}

export const robiaStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  cardTitle: {
    color: Brand.navyDark,
    fontFamily: Fonts?.rounded,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800",
  },
  body: {
    color: Brand.slate500,
    fontFamily: Fonts?.sans,
    fontSize: 14,
    lineHeight: 21,
  },
  caption: {
    color: Brand.slate400,
    fontFamily: Fonts?.sans,
    fontSize: 13,
    lineHeight: 18,
  },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FBFCFC", overflow: "hidden" },
  ambientTop: {
    position: "absolute",
    top: -110,
    right: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(20,184,166,0.055)",
  },
  ambientSide: {
    position: "absolute",
    top: 300,
    left: -120,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(29,78,216,0.025)",
  },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  fixedHeader: {
    zIndex: 20,
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 6,
  },
  fixedHeaderInner: {
    width: "100%",
    maxWidth: 720,
    minHeight: 52,
    alignSelf: "center",
    justifyContent: "center",
  },
  screenContentBelowHeader: { paddingTop: 12 },
  screenContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 112,
    gap: 22,
  },
  header: { gap: 5, marginBottom: 4 },
  headerCompact: { marginBottom: 0, gap: 0 },
  brandRow: {
    minHeight: 42,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: { width: 72, height: 40 },
  logoCompact: { width: 62, height: 32 },
  brandRowCompact: { minHeight: 48, marginBottom: 0 },
  headerButton: {
    width: 48,
    height: 48,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  navigationTitleGroup: {
    position: "absolute",
    left: 58,
    right: 58,
    top: 8,
    bottom: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  navigationTitle: {
    color: Brand.navyDark,
    fontFamily: Fonts?.rounded,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
    letterSpacing: -0.25,
    textAlign: "center",
  },
  subtitleAfterNavigation: { marginTop: 4 },
  headerActions: {
    minWidth: 40,
    minHeight: 40,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  eyebrow: {
    color: Brand.tealDark,
    fontFamily: Fonts?.sans,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.3,
  },
  title: {
    color: "#101828",
    fontFamily: Fonts?.rounded,
    fontSize: 27,
    lineHeight: 32,
    fontWeight: "900",
    letterSpacing: -0.7,
  },
  subtitle: {
    maxWidth: 520,
    color: Brand.slate500,
    fontFamily: Fonts?.sans,
    fontSize: 14,
    lineHeight: 21,
  },
  card: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: Brand.surfaceSoft,
  },
  plainSection: {
    paddingHorizontal: 0,
    backgroundColor: "transparent",
    borderRadius: 0,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeader: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: Brand.navyDark,
    fontFamily: Fonts?.rounded,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "800",
  },
  pill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pillText: {
    fontFamily: Fonts?.sans,
    fontSize: 12,
    fontWeight: "800",
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 18,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    backgroundColor: Brand.teal,
  },
  primaryButtonLabel: {
    color: Brand.white,
    fontFamily: Fonts?.sans,
    fontSize: 15,
    fontWeight: "800",
  },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
