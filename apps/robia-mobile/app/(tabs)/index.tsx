import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Brand, Colors, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MOCK_ESTABLISHMENT } from '@/src/data/mock';

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const tint = Colors[colorScheme].tint;

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: Brand.navy, dark: Brand.navyDark }}
      headerImage={
        <IconSymbol
          size={220}
          color="#ffffff55"
          name="house.fill"
          style={styles.headerIcon}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Accueil</ThemedText>
      </ThemedView>

      <ThemedText type="subtitle">{MOCK_ESTABLISHMENT.name}</ThemedText>
      <ThemedText>{MOCK_ESTABLISHMENT.city}</ThemedText>

      <ThemedView style={[styles.scoreCard, { borderColor: Colors[colorScheme].border }]}>
        <ThemedText type="defaultSemiBold">Score d&apos;impact local</ThemedText>
        <ThemedText type="title">
          {MOCK_ESTABLISHMENT.impactScore}
          <ThemedText type="subtitle"> / 100</ThemedText>
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.summaryRow}>
        <SummaryTile label="Opportunités" value={String(MOCK_ESTABLISHMENT.opportunitiesCount)} />
        <SummaryTile label="Documents prêts" value={String(MOCK_ESTABLISHMENT.documentsReadyCount)} />
        <SummaryTile label="Plan 30 jours" value={`${MOCK_ESTABLISHMENT.planProgressPercent} %`} />
      </ThemedView>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/audit')}
        style={[styles.cta, { backgroundColor: tint }]}>
        <ThemedText style={styles.ctaLabel} lightColor="#fff" darkColor="#11181C">
          Lancer un nouvel audit
        </ThemedText>
      </Pressable>
    </ParallaxScrollView>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.tile}>
      <ThemedText type="defaultSemiBold">{value}</ThemedText>
      <ThemedText style={styles.tileLabel}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    height: 178,
    width: 290,
    bottom: -40,
    left: -20,
    position: 'absolute',
  },
  scoreCard: {
    gap: 8,
    marginTop: 8,
    padding: 20,
    borderWidth: 1,
    borderRadius: Radius.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  tile: {
    flex: 1,
    gap: 4,
    padding: 12,
    borderRadius: Radius.md,
    backgroundColor: Brand.slate100,
  },
  tileLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  cta: {
    marginTop: 8,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaLabel: {
    fontWeight: '600',
  },
});
