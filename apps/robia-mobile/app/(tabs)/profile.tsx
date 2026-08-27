import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MOCK_ESTABLISHMENT } from '@/src/data/mock';

export default function ProfileScreen() {
  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ThemedView style={styles.content}>
          <ThemedText type="title">Profil</ThemedText>
          <ThemedText type="subtitle">{MOCK_ESTABLISHMENT.name}</ThemedText>
          <ThemedText>{MOCK_ESTABLISHMENT.city}</ThemedText>

          <Link href="/history" style={styles.link}>
            <ThemedText type="link">Historique des audits</ThemedText>
          </Link>
          <Link href="/reports" style={styles.link}>
            <ThemedText type="link">Rapports mensuels</ThemedText>
          </Link>
          <Link href="/settings" style={styles.link}>
            <ThemedText type="link">Paramètres du compte</ThemedText>
          </Link>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    gap: 12,
  },
  link: {
    paddingVertical: 8,
  },
});
