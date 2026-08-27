import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ReportsScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Rapports mensuels</ThemedText>
      <ThemedText>Synthèses mensuelles — à enrichir.</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 12,
  },
});
