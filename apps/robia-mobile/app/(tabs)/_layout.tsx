import { router, Tabs } from 'expo-router';
import React, { ReactNode, useMemo } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Brand, Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const TAB_ROUTES = ['index', 'opportunities', 'execution-pack', 'progress', 'profile'] as const;
const TAB_HREFS = [
  '/(tabs)',
  '/(tabs)/opportunities',
  '/(tabs)/execution-pack',
  '/(tabs)/progress',
  '/(tabs)/profile',
] as const;

function SwipeableTabScene({
  children,
  routeName,
}: {
  children: ReactNode;
  routeName: string;
}) {
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => {
          const horizontalDistance = Math.abs(gesture.dx);
          const verticalDistance = Math.abs(gesture.dy);

          return horizontalDistance > 20 && horizontalDistance > verticalDistance * 1.6;
        },
        onPanResponderRelease: (_, gesture) => {
          const currentIndex = TAB_ROUTES.indexOf(routeName as (typeof TAB_ROUTES)[number]);
          if (currentIndex < 0) return;

          const isIntentionalSwipe = Math.abs(gesture.dx) > 70 || Math.abs(gesture.vx) > 0.55;
          if (!isIntentionalSwipe) return;

          const direction = gesture.dx < 0 ? 1 : -1;
          const nextIndex = currentIndex + direction;
          if (nextIndex < 0 || nextIndex >= TAB_HREFS.length) return;

          router.navigate(TAB_HREFS[nextIndex]);
        },
        onPanResponderTerminationRequest: () => true,
      }),
    [routeName]
  );

  return (
    <View style={styles.swipeScene} {...panResponder.panHandlers}>
      {children}
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const tabBarBottom = Math.max(insets.bottom, 10);

  const renderIcon = (
    name: 'house.fill' | 'target' | 'doc.text.fill' | 'checklist' | 'person.crop.circle'
  ) =>
    function TabBarIcon({ color, focused }: { color: string; focused: boolean }) {
      return (
        <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
          <IconSymbol size={focused ? 23 : 22} name={name} color={color} />
        </View>
      );
    };

  return (
    <Tabs
      screenLayout={({ children, route }) => (
        <SwipeableTabScene routeName={route.name}>{children}</SwipeableTabScene>
      )}
      screenOptions={{
        animation: 'shift',
        transitionSpec: {
          animation: 'timing',
          config: { duration: 260 },
        },
        headerShown: false,
        sceneStyle: { backgroundColor: palette.background },
        tabBarActiveTintColor: Brand.tealDark,
        tabBarInactiveTintColor: palette.tabIconDefault,
        tabBarHideOnKeyboard: true,
        tabBarButton: HapticTab,
        tabBarStyle: [
          styles.tabBar,
          {
            bottom: tabBarBottom,
            backgroundColor: colorScheme === 'dark' ? palette.surface : 'rgba(255, 255, 255, 0.97)',
            borderColor: colorScheme === 'dark' ? palette.border : 'rgba(226, 232, 240, 0.8)',
          },
        ],
        tabBarItemStyle: styles.tabBarItem,
        tabBarIconStyle: styles.tabBarIcon,
        tabBarLabelStyle: styles.tabBarLabel,
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Accueil', tabBarIcon: renderIcon('house.fill') }}
      />
      <Tabs.Screen
        name="opportunities"
        options={{ title: 'Opportunités', tabBarIcon: renderIcon('target') }}
      />
      <Tabs.Screen
        name="execution-pack"
        options={{ title: 'Documents', tabBarIcon: renderIcon('doc.text.fill') }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: 'Suivi', tabBarIcon: renderIcon('checklist') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profil', tabBarIcon: renderIcon('person.crop.circle') }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  swipeScene: {
    flex: 1,
  },
  tabBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 74,
    paddingTop: 7,
    paddingBottom: 7,
    borderTopWidth: 1,
    borderWidth: 1,
    borderRadius: 28,
    shadowColor: Brand.navyDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 14,
  },
  tabBarItem: {
    minWidth: 58,
    paddingHorizontal: 1,
    borderRadius: 20,
  },
  tabBarIcon: {
    marginTop: 0,
  },
  tabBarLabel: {
    marginTop: 1,
    marginBottom: 1,
    fontFamily: Fonts?.sans,
    fontSize: 9.5,
    lineHeight: 12,
    fontWeight: '700',
  },
  iconContainer: {
    width: 38,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerActive: {
    backgroundColor: Brand.tealLight,
  },
});