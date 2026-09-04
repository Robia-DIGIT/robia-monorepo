import { IconSymbol } from '@/components/ui/icon-symbol';
import { Brand, Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  createMaterialTopTabNavigator,
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationOptions,
} from '@react-navigation/material-top-tabs';
import { ParamListBase, TabNavigationState } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { router, usePathname, withLayoutContext } from 'expo-router';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { Navigator } = createMaterialTopTabNavigator();

const SwipeTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator);

type RobiaIconName =
  | 'house.fill'
  | 'target'
  | 'doc.text.fill'
  | 'checklist'
  | 'bubble.left.and.bubble.right.fill'
  | 'person.crop.circle';

function AnimatedTabIcon({
  name,
  color,
  focused,
}: {
  name: RobiaIconName;
  color: string;
  focused: boolean;
}) {
  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(focused ? 1 : 0, {
      duration: focused ? 240 : 180,
      easing: Easing.out(Easing.cubic),
    });
  }, [focused, progress]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -1]) },
      { scale: interpolate(progress.value, [0, 1], [1, 1.08]) },
    ],
  }));

  return (
    <View style={styles.iconContainer}>
      {focused ? (
        <Animated.View
          entering={FadeIn.duration(0)}
          exiting={FadeOut.duration(140)}
          style={styles.iconContainerActive}
        />
      ) : null}
      <Animated.View style={animatedIconStyle}>
        <IconSymbol size={22} name={name} color={color} />
      </Animated.View>
      {focused ? (
        <Animated.View entering={FadeIn.delay(80).duration(180)} style={styles.activeDot} />
      ) : null}
    </View>
  );
}

function createTabIcon(name: RobiaIconName) {
  return function TabBarIcon({ color, focused }: { color: string; focused: boolean }) {
    return <AnimatedTabIcon name={name} color={color} focused={focused} />;
  };
}

function createTabLabel(label: string) {
  return function TabBarLabel({ focused, color }: { focused: boolean; color: string }) {
    return focused ? (
      <Animated.Text
        entering={FadeIn.duration(180)}
        exiting={FadeOut.duration(120)}
        style={[styles.tabBarLabel, { color }]}
      >
        {label}
      </Animated.Text>
    ) : null;
  };
}

const tabListeners = {
  tabPress: () => {
    void Haptics.selectionAsync();
  },
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const bottomSpacing = Math.max(insets.bottom, 10);
  const pathname = usePathname();
  const assistantActive = pathname.endsWith('/chat');

  return (
    <View style={styles.root}>
      <SwipeTabs
      initialRouteName="dashboard"
      tabBarPosition="bottom"
      screenOptions={{
        animationEnabled: true,
        swipeEnabled: true,
        lazy: false,
        tabBarActiveTintColor: Brand.tealDark,
        tabBarInactiveTintColor: Brand.slate400,
        tabBarShowIcon: true,
        tabBarShowLabel: true,
        tabBarPressColor: 'rgba(20,184,166,0.24)',
        tabBarPressOpacity: 0.72,
        sceneStyle: { backgroundColor: palette.background },
        tabBarStyle: [
          styles.tabBar,
          {
            marginBottom: bottomSpacing,
            backgroundColor: Brand.white,
            borderColor: '#EDF1F3',
          },
        ],
        tabBarItemStyle: styles.tabBarItem,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIndicatorStyle: styles.tabBarIndicator,
      }}>
      <SwipeTabs.Screen
        name="dashboard"
        listeners={tabListeners}
        options={{
          title: 'Accueil',
          tabBarLabel: createTabLabel('Accueil'),
          tabBarIcon: createTabIcon('house.fill'),
        }}
      />
      <SwipeTabs.Screen
        name="opportunities"
        listeners={tabListeners}
        options={{
          title: 'Opportunités',
          tabBarLabel: createTabLabel('Opportunités'),
          tabBarIcon: createTabIcon('target'),
        }}
      />
      <SwipeTabs.Screen
        name="chat"
        listeners={tabListeners}
        options={{
          title: 'Assistant',
          tabBarLabel: createTabLabel('Assistant'),
          tabBarIcon: createTabIcon('bubble.left.and.bubble.right.fill'),
          tabBarItemStyle: styles.hiddenTab,
        }}
      />
      <SwipeTabs.Screen
        name="execution-pack"
        listeners={tabListeners}
        options={{
          title: 'Documents',
          tabBarLabel: createTabLabel('Documents'),
          tabBarIcon: createTabIcon('doc.text.fill'),
        }}
      />
      <SwipeTabs.Screen
        name="progress"
        listeners={tabListeners}
        options={{
          title: 'Suivi',
          tabBarLabel: createTabLabel('Suivi'),
          tabBarIcon: createTabIcon('checklist'),
        }}
      />
      <SwipeTabs.Screen
        name="profile"
        listeners={tabListeners}
        options={{
          title: 'Profil',
          tabBarLabel: createTabLabel('Profil'),
          tabBarIcon: createTabIcon('person.crop.circle'),
        }}
      />
      </SwipeTabs>
      <Pressable
        accessibilityLabel="Ouvrir l’assistant RobIA"
        accessibilityRole="button"
        accessibilityState={{ selected: assistantActive }}
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.navigate('/(tabs)/chat');
        }}
        style={({ pressed }) => [
          styles.assistantButton,
          { bottom: bottomSpacing + 84 },
          assistantActive && styles.assistantButtonActive,
          pressed && styles.assistantButtonPressed,
        ]}>
        <View pointerEvents="none" style={styles.assistantGlow} />
        <View pointerEvents="none" style={styles.assistantAccent} />
        <MaterialIcons name="auto-awesome" size={25} color={Brand.white} />
        <View style={styles.onlineDot} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hiddenTab: { display: 'none' },
  assistantButton: {
    position: 'absolute',
    right: 19,
    zIndex: 30,
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: Brand.navyDark,
    borderWidth: 3,
    borderColor: Brand.white,
    shadowColor: Brand.navyDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 15,
    elevation: 12,
  },
  assistantButtonActive: { borderColor: Brand.tealLight, transform: [{ scale: 1.04 }] },
  assistantButtonPressed: { opacity: 0.88, transform: [{ scale: 0.94 }] },
  assistantGlow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    right: -25,
    top: -24,
    backgroundColor: Brand.teal,
  },
  assistantAccent: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    left: -7,
    bottom: -6,
    backgroundColor: Brand.electric,
  },
  onlineDot: {
    position: 'absolute',
    right: 7,
    top: 7,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: Brand.orange,
    borderWidth: 2,
    borderColor: Brand.white,
  },
  tabBar: {
    height: 72,
    marginHorizontal: 16,
    marginTop: 8,
    paddingTop: 5,
    paddingBottom: 5,
    borderWidth: 1,
    borderRadius: 100,
    shadowColor: Brand.navyDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 14,
  },
  tabBarItem: {
    minHeight: 62,
    paddingHorizontal: 1,
    paddingVertical: 2,
  },
  tabBarLabel: {
    margin: 0,
    fontFamily: Fonts?.sans,
    fontSize: 9.5,
    lineHeight: 12,
    fontWeight: '700',
    textTransform: 'none',
  },
  tabBarIndicator: {
    display: 'none',
  },
  iconContainer: {
    width: 38,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerActive: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Brand.tealLight,
    borderRadius: 40,
  },
  activeDot: {
    position: 'absolute',
    bottom: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Brand.teal,
  },
});
