import { IconSymbol } from '@/components/ui/icon-symbol';
import { Brand, Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  createMaterialTopTabNavigator,
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationOptions,
} from '@react-navigation/material-top-tabs';
import { ParamListBase, TabNavigationState } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { withLayoutContext } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
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

  return (
    <SwipeTabs
      initialRouteName="dashboard"
      tabBarPosition="bottom"
      screenOptions={{
        animationEnabled: true,
        swipeEnabled: true,
        lazy: false,
        tabBarActiveTintColor: Brand.tealDark,
        tabBarInactiveTintColor: palette.tabIconDefault,
        tabBarShowIcon: true,
        tabBarShowLabel: true,
        tabBarPressColor: Brand.tealLight,
        tabBarPressOpacity: 0.72,
        sceneStyle: { backgroundColor: palette.background },
        tabBarStyle: [
          styles.tabBar,
          {
            marginBottom: bottomSpacing,
            backgroundColor:
              colorScheme === 'dark' ? palette.surface : 'rgba(255, 255, 255, 0.97)',
            borderColor:
              colorScheme === 'dark' ? palette.border : 'rgba(226, 232, 240, 0.8)',
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
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 74,
    marginHorizontal: 18,
    marginTop: 8,
    paddingTop: 5,
    paddingBottom: 5,
    borderWidth: 1,
    borderRadius: 100,
    shadowColor: Brand.navyDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
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
    backgroundColor: Brand.tealDark,
  },
});
