import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="audit" options={{ presentation: 'modal', title: 'Nouvel audit' }} />
        <Stack.Screen name="history" options={{ title: 'Historique' }} />
        <Stack.Screen name="reports" options={{ title: 'Rapports' }} />
        <Stack.Screen name="settings" options={{ title: 'Paramètres' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
