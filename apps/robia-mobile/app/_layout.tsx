import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { Brand, Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = { anchor: '(tabs)', initialRouteName: 'index' };

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const baseTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = { ...baseTheme, colors: { ...baseTheme.colors, primary: palette.tint, background: palette.background, card: palette.surface, text: palette.text, border: palette.border, notification: palette.opportunity } };

  const screenOptions = {
    headerStyle: { backgroundColor: Brand.slate50 },
    headerTintColor: Brand.navyDark,
    headerShadowVisible: false,
    headerTitleStyle: { fontFamily: Fonts?.rounded, fontWeight: '800' as const },
    contentStyle: { backgroundColor: Brand.slate50 },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <Stack screenOptions={screenOptions}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: '' }} />
        <Stack.Screen name="audit" options={{ presentation: 'modal', title: 'Nouvel audit' }} />
        <Stack.Screen name="history" options={{ title: 'Historique' }} />
        <Stack.Screen name="reports" options={{ title: 'Rapports' }} />
        <Stack.Screen name="settings" options={{ title: 'Paramètres' }} />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}
