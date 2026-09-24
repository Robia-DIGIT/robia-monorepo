import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { router } from "expo-router";
import {
    Children,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type PropsWithChildren,
    type ReactNode,
} from "react";
import {
    Animated,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
    type StyleProp,
    type ViewStyle,
} from "react-native";
import { Gesture, GestureDetector, type PanGesture } from 'react-native-gesture-handler';
import { SafeAreaView } from "react-native-safe-area-context";

import type { FilterMotion } from '@/hooks/use-filter-motion';

import { Brand, Fonts } from "@/constants/theme";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

type IconName = React.ComponentProps<typeof MaterialIcons>["name"];

export function RobiaScreen({
  children,
  scroll = true,
  contentStyle,
  fixedHeader = false,
  refreshing = false,
  onRefresh,
  swipeGesture,
}: PropsWithChildren<{
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  fixedHeader?: boolean;
  refreshing?: boolean;
  onRefresh?: () => Promise<unknown>;
  swipeGesture?: PanGesture;
}>) {
  // The vertical scroll waits only until the horizontal gesture fails. This
  // lets native direction detection decide before a ScrollView takes the touch.
  const nativeScrollGesture = useMemo(() => {
    const gesture = Gesture.Native();
    return swipeGesture ? gesture.requireExternalGestureToFail(swipeGesture) : gesture;
  }, [swipeGesture]);
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

  const scrollView = (
    <ScrollView
      accessibilityRole="none"
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
  );

  const screen = (
    <SafeAreaView collapsable={false} style={styles.safeArea} edges={["top", "bottom"]}>
      {/* <View pointerEvents="none" style={styles.ambientTop} />
      <View pointerEvents="none" style={styles.ambientSide} /> */}
      {header ? (
        <View style={styles.fixedHeader}>
          <View style={styles.fixedHeaderInner}>{header}</View>
        </View>
      ) : null}
      {scroll ? (
        swipeGesture ? (
          <GestureDetector gesture={nativeScrollGesture} touchAction="pan-y">
            {scrollView}
          </GestureDetector>
        ) : scrollView
      ) : (
        content
      )}
    </SafeAreaView>
  );

  return swipeGesture ? (
    <GestureDetector gesture={swipeGesture} touchAction="pan-y">
      {screen}
    </GestureDetector>
  ) : screen;
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
            <Text accessibilityRole="header" style={styles.navigationTitle}>
              {title}
            </Text>
          </View>
        ) : null}
        <View style={styles.headerActions}>
          {back ? (
            <Image
              source={require("@/assets/images/logo-robia-copilot.svg")}
              contentFit="contain"
              style={styles.compactBrandMark}
              accessibilityLabel="Logo RobIA Copilot"
            />
          ) : null}
          {action}
        </View>
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

export function RobiaFixedHeader({ children }: PropsWithChildren) {
  return <View style={styles.fixedHeaderGroup}>{children}</View>;
}

export function FilterTransition({
  filterKey,
  options,
  motion,
  reduceMotion,
  swipeGesture,
  refreshing = false,
  onRefresh,
  children,
}: {
  filterKey: string;
  options: readonly string[];
  motion: FilterMotion;
  reduceMotion: boolean;
  swipeGesture: PanGesture;
  refreshing?: boolean;
  onRefresh?: () => Promise<unknown>;
  children: (filter: string) => ReactNode;
}) {
  const index = Math.max(0, options.indexOf(filterKey));
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    motion.configure(index, width, reduceMotion);
  }, [index, width, motion, reduceMotion]);

  return (
    <View style={styles.filterTransitionViewport}
      onLayout={({ nativeEvent }) => setWidth(nativeEvent.layout.width)}>
      {width > 0 && (
        <Animated.View collapsable={false} style={[
          styles.filterTransitionTrack,
          { width: width * options.length, transform: [{ translateX: motion.offset }] },
        ]}>
          {options.map((option, pageIndex) => (
            <FilterPage key={option} width={width} active={pageIndex === index}
              swipeGesture={swipeGesture} refreshing={refreshing} onRefresh={onRefresh}>
              {children(option)}
            </FilterPage>
          ))}
        </Animated.View>
      )}
    </View>
  );
}

function FilterPage({ width, active, swipeGesture, refreshing, onRefresh, children }: PropsWithChildren<{
  width: number;
  active: boolean;
  swipeGesture: PanGesture;
  refreshing: boolean;
  onRefresh?: () => Promise<unknown>;
}>) {
  const nativeScrollGesture = useMemo(() =>
    Gesture.Native().requireExternalGestureToFail(swipeGesture), [swipeGesture]);

  return (
    <View collapsable={false}
      pointerEvents={active ? 'auto' : 'none'}
      accessibilityElementsHidden={!active}
      importantForAccessibility={active ? 'auto' : 'no-hide-descendants'}
      style={[styles.filterTransitionPage, { width }]}>
      <GestureDetector gesture={nativeScrollGesture} touchAction="pan-y">
        <ScrollView style={styles.scroll}
          removeClippedSubviews={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
          refreshControl={onRefresh ? <RefreshControl refreshing={refreshing}
            onRefresh={() => void onRefresh()} tintColor={Brand.tealDark} /> : undefined}
          contentContainerStyle={styles.filterPageContent}>
          {children}
        </ScrollView>
      </GestureDetector>
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
      <Text accessibilityRole="header" style={styles.sectionTitle}>{title}</Text>
      {action}
    </View>
  );
}

export function FilterChips({
  options,
  selected,
  onChange,
  swipeToSelect = false,
}: {
  options: readonly string[];
  selected: string;
  onChange: (value: string) => void;
  swipeToSelect?: boolean;
}) {
  const scroll = useRef<ScrollView>(null);
  const viewportWidth = useRef(0);
  const positions = useRef<Record<string, { x: number; width: number }>>({});
  const reduceMotion = useReducedMotion();
  const revealSelected = useCallback(() => {
    const position = positions.current[selected];
    if (!position || !viewportWidth.current) return;
    scroll.current?.scrollTo({
      x: Math.max(0, position.x - (viewportWidth.current - position.width) / 2),
      animated: !reduceMotion,
    });
  }, [selected, reduceMotion]);

  useEffect(revealSelected, [revealSelected]);

  return (
    <ScrollView
      ref={scroll}
      horizontal
      scrollEnabled={!swipeToSelect}
      onLayout={(event) => {
        viewportWidth.current = event.nativeEvent.layout.width;
        revealSelected();
      }}
      nestedScrollEnabled
      directionalLockEnabled
      alwaysBounceHorizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterChips}
      accessibilityRole="tablist">
      {options.map((option) => {
        const active = option === selected;
        return (
          <Pressable
            key={option}
            onLayout={(event) => {
              const { x, width } = event.nativeEvent.layout;
              positions.current[option] = { x, width };
              if (active) revealSelected();
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option)}
            style={[styles.filterChip, active && styles.filterChipActive]}>
            <Text style={[styles.filterChipLabel, active && styles.filterChipLabelActive]}>{option}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
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
    orange: { backgroundColor: Brand.orangeLight, color: '#9A3412' },
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
    top: -138,
    right: -92,
    width: 228,
    height: 228,
    borderRadius: 114,
    borderWidth: 1,
    borderColor: "rgba(15,118,110,0.10)",
    backgroundColor: "rgba(20,184,166,0.018)",
  },
  ambientSide: {
    position: "absolute",
    top: 356,
    left: -108,
    width: 176,
    height: 176,
    borderRadius: 88,
    borderWidth: 1,
    borderColor: "rgba(29,78,216,0.075)",
    backgroundColor: "rgba(29,78,216,0.012)",
  },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  fixedHeader: {
    zIndex: 20,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: "#FBFCFC",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.borderSubtle,
  },
  fixedHeaderInner: {
    width: "100%",
    maxWidth: 720,
    minHeight: 52,
    alignSelf: "center",
    justifyContent: "center",
  },
  fixedHeaderGroup: { gap: 10 },
  filterTransitionViewport: { flex: 1, overflow: "hidden" },
  filterTransitionTrack: { flex: 1, flexDirection: 'row' },
  filterTransitionPage: { height: '100%', flexShrink: 0, overflow: 'hidden' },
  filterPageContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 112, gap: 22 },
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
  compactBrandMark: { width: 30, height: 30, opacity: 0.9 },
  brandRowCompact: { minHeight: 48, marginBottom: 0 },
  headerButton: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: Brand.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Brand.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  navigationTitleGroup: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  navigationTitle: {
    color: Brand.navyDark,
    fontFamily: Fonts?.rounded,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900",
    letterSpacing: -0.25,
    textAlign: "left",
  },
  subtitleAfterNavigation: { marginTop: 4 },
  headerActions: {
    minWidth: 40,
    flexDirection: "row",
    gap: 8,
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
    borderRadius: 12,
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
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeader: {
    minHeight: 28,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
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
  filterChips: { gap: 8, paddingVertical: 2 },
  filterChip: { minHeight: 36, paddingHorizontal: 14, borderRadius: 8, justifyContent: "center", backgroundColor: Brand.white, borderWidth: 1, borderColor: Brand.borderSubtle },
  filterChipActive: { backgroundColor: Brand.navyDark, borderColor: Brand.navyDark },
  filterChipLabel: { color: Brand.slate500, fontFamily: Fonts?.sans, fontSize: 12, fontWeight: "700" },
  filterChipLabelActive: { color: Brand.white },
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
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    backgroundColor: Brand.tealDark,
  },
  primaryButtonLabel: {
    flexShrink: 1,
    textAlign: 'center',
    color: Brand.white,
    fontFamily: Fonts?.sans,
    fontSize: 15,
    fontWeight: "800",
  },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
