import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, type ComponentProps } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function AuditScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const tint = Colors[colorScheme].tint;
  const textColor = Colors[colorScheme].text;
  const borderColor = Colors[colorScheme].border;
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [city, setCity] = useState('');
  const [industry, setIndustry] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  async function launchAudit() {
    if (isRunning) {
      return;
    }

    setIsRunning(true);
    await new Promise((resolve) => setTimeout(resolve, 1600));
    setIsRunning(false);
    router.dismissTo('/');
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ThemedView style={styles.container}>
        <ThemedText type="title">Audit gratuit</ThemedText>
        <ThemedText>
          Indiquez le site, la ville et le secteur. ROBIA prépare ensuite des opportunités à
          valider — sans rien publier à votre place.
        </ThemedText>

        <LabeledInput
          label="URL du site"
          placeholder="https://salon-lova.mg"
          value={websiteUrl}
          onChangeText={setWebsiteUrl}
          autoCapitalize="none"
          keyboardType="url"
          color={textColor}
          borderColor={borderColor}
        />
        <LabeledInput
          label="Ville"
          placeholder="Antananarivo"
          value={city}
          onChangeText={setCity}
          color={textColor}
          borderColor={borderColor}
        />
        <LabeledInput
          label="Secteur d'activité"
          placeholder="Coiffure"
          value={industry}
          onChangeText={setIndustry}
          color={textColor}
          borderColor={borderColor}
        />

        {isRunning ? (
          <ThemedView style={styles.loading}>
            <ActivityIndicator color={tint} />
            <ThemedText>Analyse en cours…</ThemedText>
          </ThemedView>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={launchAudit}
            style={[styles.cta, { backgroundColor: tint }]}>
            <ThemedText style={styles.ctaLabel} lightColor="#fff" darkColor="#11181C">
              Lancer l&apos;audit gratuit
            </ThemedText>
          </Pressable>
        )}

        <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

function LabeledInput({
  label,
  color,
  borderColor,
  ...inputProps
}: {
  label: string;
  color: string;
  borderColor: string;
} & ComponentProps<typeof TextInput>) {
  return (
    <ThemedView style={styles.field}>
      <ThemedText type="defaultSemiBold">{label}</ThemedText>
      <TextInput
        placeholderTextColor="#687076"
        style={[styles.input, { color, borderColor }]}
        {...inputProps}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  field: {
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
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
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
});
