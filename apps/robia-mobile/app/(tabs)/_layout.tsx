import {
  createMaterialTopTabNavigator,
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationOptions,
} from '@react-navigation/material-top-tabs';
import { ParamListBase, TabNavigationState } from '@react-navigation/native';
import { withLayoutContext } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Brand, Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

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

function createTabIcon(name: RobiaIconName) {
  return function TabBarIcon({ color, focused }: { color: string; focused: boolean }) {
    return (
      <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
        <IconSymbol size={focused ? 23 : 22} name={name} color={color} />
      </View>
    );
  };
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const bottomSpacing = Math.max(insets.bottom, 10);

  return (
    <SwipeTabs
      initialRouteName="index"
      screenOptions={{
        animationEnabled: true,
        swipeEnabled: true,
        lazy: false,
        tabBarPosition: 'bottom',
        tabBarActiveTintColor: Brand.tealDark,
        tabBarInactiveTintColor: palette.tabIconDefault,
        tabBarShowIcon: true,
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
        tabBarIconStyle: styles.tabBarIcon,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIndicatorStyle: styles.tabBarIndicator,
      }}>
      <SwipeTabs.Screen
        name="index"
        options={{ title: 'Accueil', tabBarIcon: createTabIcon('house.fill') }}
      />
      <SwipeTabs.Screen
        name="opportunities"
        options={{ title: 'Opportunités', tabBarIcon: createTabIcon('target') }}
      />
      <SwipeTabs.Screen
        name="execution-pack"
        options={{ title: 'Documents', tabBarIcon: createTabIcon('doc.text.fill') }}
      />
      <SwipeTabs.Screen
        name="progress"
        options={{ title: 'Suivi', tabBarIcon: createTabIcon('checklist') }}
      />
      <SwipeTabs.Screen
        name="profile"
        options={{ title: 'Profil', tabBarIcon: createTabIcon('person.crop.circle') }}
      />
    </SwipeTabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 74,
    marginHorizontal: 16,
    marginTop: 8,
    paddingTop: 5,
    paddingBottom: 5,
    borderWidth: 1,
    borderRadius: 28,
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
  tabBarIcon: {
    width: 38,
    height: 32,
    margin: 0,
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
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerActive: {
    backgroundColor: Brand.tealLight,
  },
});