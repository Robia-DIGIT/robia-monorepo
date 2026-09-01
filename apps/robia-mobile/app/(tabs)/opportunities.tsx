import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MOCK_OPPORTUNITIES, type ImpactLevel } from '@/src/data/mock';
import { Brand, Radius } from '@/constants/theme';

export default function OpportunitiesScreen() {
  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="title">Opportunités</ThemedText>
          <ThemedText>Actions recommandées pour améliorer votre visibilité locale.</ThemedText>

          {MOCK_OPPORTUNITIES.map((item) => (
            <ThemedView key={item.id} style={styles.card}>
              <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
              <ThemedText>{item.description}</ThemedText>
              <View style={styles.metaRow}>
                <MetaChip label="Impact" value={item.impact} />
                <MetaChip label="Effort" value={item.effort} />
                <MetaChip label="Confiance IA" value={`${item.confidence} %`} />
              </View>
            </ThemedView>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function MetaChip({ label, value }: { label: string; value: ImpactLevel | string }) {
  return (
    <View style={styles.chip}>
      <ThemedText style={styles.chipLabel}>{label}</ThemedText>
      <ThemedText type="defaultSemiBold">{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: 24,
    gap: 16,
    paddingBottom: 40,
  },
  card: {
    gap: 8,
    padding: 16,
    borderRadius: Radius.lg,
    borderLeftWidth: 4,
    borderLeftColor: Brand.orange,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chip: {
    gap: 2,
    minWidth: 90,
    padding: 8,
    borderRadius: Radius.sm,
    backgroundColor: Brand.slate100,
  },
  chipLabel: {
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.7,
  },
});
