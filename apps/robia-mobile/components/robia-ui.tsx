import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { type PropsWithChildren, type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, Fonts } from '@/constants/theme';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

export function RobiaScreen({
  children,
  scroll = true,
  contentStyle,
}: PropsWithChildren<{ scroll?: boolean; contentStyle?: StyleProp<ViewStyle> }>) {
  const content = <View style={[styles.screenContent, contentStyle]}>{children}</View>;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
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
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <Image
          source={require('@/assets/images/logo-robia-copilot.svg')}
          contentFit="contain"
          style={styles.logo}
          accessibilityLabel="Logo RobIA Copilot"
        />
        {action}
      </View>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function RobiaCard({
  children,
  style,
  accent,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle>; accent?: string }>) {
  return (
    <View style={[styles.card, accent ? { borderTopColor: accent, borderTopWidth: 3 } : null, style]}>
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
  tone = 'teal',
}: {
  label: string;
  tone?: 'teal' | 'orange' | 'navy' | 'neutral';
}) {
  const tones = {
    teal: { backgroundColor: Brand.tealLight, color: Brand.tealDark },
    orange: { backgroundColor: Brand.orangeLight, color: Brand.orangeDark },
    navy: { backgroundColor: Brand.electricLight, color: Brand.electricDark },
    neutral: { backgroundColor: Brand.slate100, color: Brand.slate500 },
  };

  return (
    <View style={[styles.pill, { backgroundColor: tones[tone].backgroundColor }]}>
      <Text style={[styles.pillText, { color: tones[tone].color }]}>{label}</Text>
    </View>
  );
}

export function PrimaryButton({
  label,
  icon = 'arrow-forward',
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
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}>
      <Text style={styles.primaryButtonLabel}>{label}</Text>
      <MaterialIcons name={icon} size={19} color={Brand.white} />
    </Pressable>
  );
}

export const robiaStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: {
    color: Brand.navyDark,
    fontFamily: Fonts?.rounded,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
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
    fontSize: 12,
    lineHeight: 16,
  },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Brand.slate50 },
  scrollContent: { flexGrow: 1 },
  screenContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 96,
    gap: 20,
  },
  header: { gap: 6, marginBottom: 2 },
  brandRow: {
    minHeight: 42,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: { width: 58, height: 38 },
  eyebrow: {
    color: Brand.tealDark,
    fontFamily: Fonts?.sans,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  title: {
    color: Brand.navyDark,
    fontFamily: Fonts?.rounded,
    fontSize: 30,
    lineHeight: 35,
    fontWeight: '900',
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
    padding: 18,
    borderRadius: 24,
    backgroundColor: Brand.white,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.8)',
    shadowColor: Brand.navyDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: Brand.navyDark,
    fontFamily: Fonts?.rounded,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '800',
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pillText: {
    fontFamily: Fonts?.sans,
    fontSize: 11,
    fontWeight: '800',
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 18,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    backgroundColor: Brand.teal,
  },
  primaryButtonLabel: {
    color: Brand.white,
    fontFamily: Fonts?.sans,
    fontSize: 15,
    fontWeight: '800',
  },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
