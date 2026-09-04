import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { router, Stack, usePathname, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import 'react-native-reanimated';

import { Brand, Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { RobiaDataProvider } from '@/src/api/data';
import { SessionProvider, useSession } from '@/src/auth/session';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync().catch(() => {
  // The native splash may already be hidden during fast refresh.
});

if (Constants.executionEnvironment !== ExecutionEnvironment.StoreClient) {
  SplashScreen.setOptions({ duration: 250, fade: true });
}

export const unstable_settings = { anchor: '(tabs)', initialRouteName: 'index' };

export default function RootLayout() {
  return <SessionProvider><RobiaDataProvider><AppLayout /></RobiaDataProvider></SessionProvider>;
}

function AppLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const pathname = usePathname();
  const { token, isLoading } = useSession();
  const palette = Colors[colorScheme ?? 'light'];
  const baseTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  const [showLaunchAnimation, setShowLaunchAnimation] = useState(true);
  const launchProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isLoading) return;
    const section = segments[0];
    if (!token && section === '(tabs)') router.replace('/auth');
    if (token && (section === 'auth' || section === undefined)) router.replace('/(tabs)/dashboard');
  }, [isLoading, segments, token]);

  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: palette.tint,
      background: palette.background,
      card: palette.surface,
      text: palette.text,
      border: palette.border,
      notification: palette.opportunity,
    },
  };

  const screenOptions = {
    animation: 'slide_from_right' as const,
    animationDuration: 260,
    gestureEnabled: true,
    fullScreenGestureEnabled: true,
    animationMatchesGesture: true,
    headerStyle: { backgroundColor: Brand.slate50 },
    headerTintColor: Brand.navyDark,
    headerShadowVisible: false,
    headerTitleStyle: { fontFamily: Fonts?.rounded, fontWeight: '800' as const },
    contentStyle: { backgroundColor: Brand.slate50 },
  };

  const finishLaunchAnimation = useCallback(() => {
    setShowLaunchAnimation(false);
  }, []);

  useEffect(() => {
    const animation = Animated.timing(launchProgress, {
      toValue: 1,
      duration: 3800,
      easing: Easing.bezier(0.22, 0.72, 0.2, 1),
      useNativeDriver: true,
    });

    animation.start(({ finished }) => {
      if (finished) finishLaunchAnimation();
    });

    const fallbackTimer = setTimeout(finishLaunchAnimation, 5000);

    return () => {
      animation.stop();
      clearTimeout(fallbackTimer);
    };
  }, [finishLaunchAnimation, launchProgress]);

  const revealAnimation = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {
      // Nothing to do if the native splash is already hidden.
    });
  }, []);

  function createLayerStyle({
    start,
    reveal,
    land,
    settle,
    fromX,
    curveX,
    fromY,
    curveY,
    rotation,
  }: {
    start: number;
    reveal: number;
    land: number;
    settle: number;
    fromX: number;
    curveX: number;
    fromY: number;
    curveY: number;
    rotation: string;
  }) {
    const curve = start + (land - start) * 0.58;
    const rebound = land + (settle - land) * 0.32;
    const counterRebound = land + (settle - land) * 0.65;

    return {
      opacity: launchProgress.interpolate({
        inputRange: [start, reveal, 1],
        outputRange: [0, 1, 1],
        extrapolate: 'clamp' as const,
      }),
      transform: [
        {
          translateX: launchProgress.interpolate({
            inputRange: [start, curve, land, settle, 1],
            outputRange: [fromX, curveX, 0, 0, 0],
            extrapolate: 'clamp',
          }),
        },
        {
          translateY: launchProgress.interpolate({
            inputRange: [start, curve, land, settle, 1],
            outputRange: [fromY, curveY, 0, 0, 0],
            extrapolate: 'clamp',
          }),
        },
        {
          rotate: launchProgress.interpolate({
            inputRange: [start, curve, land, rebound, settle, 1],
            outputRange: [rotation, '-105deg', '10deg', '-3deg', '0deg', '0deg'],
            extrapolate: 'clamp',
          }),
        },
        {
          scaleX: launchProgress.interpolate({
            inputRange: [start, reveal, land, rebound, counterRebound, settle, 1],
            outputRange: [0.04, 0.3, 1.12, 0.91, 1.045, 1, 1],
            extrapolate: 'clamp',
          }),
        },
        {
          scaleY: launchProgress.interpolate({
            inputRange: [start, reveal, land, rebound, counterRebound, settle, 1],
            outputRange: [0.04, 0.3, 0.88, 1.13, 0.965, 1, 1],
            extrapolate: 'clamp',
          }),
        },
      ],
    };
  }

  const leftStyle = createLayerStyle({
    start: 0.02,
    reveal: 0.08,
    land: 0.3,
    settle: 0.48,
    fromX: -170,
    curveX: -58,
    fromY: 150,
    curveY: -88,
    rotation: '-320deg',
  });
  const circleStyle = createLayerStyle({
    start: 0.1,
    reveal: 0.16,
    land: 0.38,
    settle: 0.56,
    fromX: 160,
    curveX: 52,
    fromY: 135,
    curveY: -96,
    rotation: '320deg',
  });
  const monogramStyle = createLayerStyle({
    start: 0.18,
    reveal: 0.24,
    land: 0.46,
    settle: 0.64,
    fromX: -135,
    curveX: -42,
    fromY: 185,
    curveY: -76,
    rotation: '-300deg',
  });
  const tailStyle = createLayerStyle({
    start: 0.26,
    reveal: 0.32,
    land: 0.54,
    settle: 0.72,
    fromX: 145,
    curveX: 46,
    fromY: 170,
    curveY: -70,
    rotation: '300deg',
  });
  const overlayOpacity = launchProgress.interpolate({
    inputRange: [0, 0.88, 1],
    outputRange: [1, 1, 0],
  });
  const showAssistantButton = Boolean(token) && !isLoading && pathname !== '/chat';

  return (
    <ThemeProvider value={navigationTheme}>
      <Stack screenOptions={screenOptions}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="auth"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="chat" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: '' }} />
        <Stack.Screen
          name="audit"
          options={{ presentation: 'modal', animation: 'slide_from_bottom', title: 'Nouvel audit' }}
        />
        <Stack.Screen name="history" options={{ title: 'Historique' }} />
        <Stack.Screen name="reports" options={{ title: 'Rapports' }} />
        <Stack.Screen name="settings" options={{ title: 'Paramètres' }} />
      </Stack>

      {showAssistantButton ? (
        <Pressable
          accessibilityLabel="Ouvrir l'assistant RobIA"
          accessibilityRole="button"
          onPress={() => router.push('/chat')}
          style={[styles.assistantButton, { bottom: Math.max(insets.bottom, 10) + 86 }]}>
          <View pointerEvents="none" style={styles.assistantRing} />
          <MaterialIcons name="android" size={28} color={Brand.white} />
          <Text style={styles.assistantBadge}>IA</Text>
        </Pressable>
      ) : null}

      {showLaunchAnimation ? (
        <Animated.View
          accessibilityLabel="Démarrage de RobIA Copilot"
          accessibilityRole="progressbar"
          onLayout={revealAnimation}
          style={[styles.launchOverlay, { opacity: overlayOpacity }]}>
          <View style={styles.logoStage}>
            <Animated.Image
              source={require('@/assets/images/logo-parts/robia-tail.png')}
              resizeMode="contain"
              style={[styles.logoLayer, tailStyle]}
            />
            <Animated.Image
              source={require('@/assets/images/logo-parts/robia-circle.png')}
              resizeMode="contain"
              style={[styles.logoLayer, circleStyle]}
            />
            <Animated.Image
              source={require('@/assets/images/logo-parts/robia-left.png')}
              resizeMode="contain"
              style={[styles.logoLayer, leftStyle]}
            />
            <Animated.Image
              source={require('@/assets/images/logo-parts/robia-ia.png')}
              resizeMode="contain"
              style={[styles.logoLayer, monogramStyle]}
            />
          </View>
        </Animated.View>
      ) : null}

      <StatusBar style="dark" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  assistantButton: {
    position: 'absolute',
    right: 18,
    zIndex: 900,
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.navyDark,
    borderWidth: 3,
    borderColor: Brand.teal,
    shadowColor: Brand.navyDark,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 16,
  },
  assistantRing: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  assistantBadge: {
    position: 'absolute',
    right: 5,
    bottom: 3,
    color: Brand.navyDark,
    fontSize: 8,
    fontWeight: '900',
    backgroundColor: Brand.teal,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 4,
  },
  launchOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.slate50,
  },
  logoStage: {
    width: '62%',
    maxWidth: 270,
    aspectRatio: 1080 / 662,
  },
  logoLayer: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
});
