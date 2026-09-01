import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MOCK_DOCUMENTS } from '@/src/data/mock';
import { Brand, Radius } from '@/constants/theme';

export default function ExecutionPackScreen() {
  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="title">Documents</ThemedText>
          <ThemedText>
            Pack d&apos;exécution généré pour votre établissement. ROBIA ne publie jamais à votre
            place.
          </ThemedText>

          {MOCK_DOCUMENTS.map((doc) => (
            <ThemedView key={doc.id} style={styles.card}>
              <ThemedText type="defaultSemiBold">{doc.title}</ThemedText>
              <ThemedText>Statut : {doc.status}</ThemedText>
              <ThemedText style={styles.disclaimer}>
                ROBIA ne publie jamais à votre place.
              </ThemedText>
            </ThemedView>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
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
    gap: 6,
    padding: 16,
    borderRadius: Radius.lg,
    borderLeftWidth: 4,
    borderLeftColor: Brand.teal,
  },
  disclaimer: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.75,
  },
});
