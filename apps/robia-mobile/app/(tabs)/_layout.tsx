import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Brand, Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: palette.tabIconSelected,
      tabBarInactiveTintColor: palette.tabIconDefault,
      tabBarStyle: {
        position: 'absolute',
        backgroundColor: palette.surface,
        borderTopColor: 'transparent',
        height: 72,
        paddingTop: 8,
        paddingBottom: 8,
        shadowColor: Brand.navyDark,
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.06,
        shadowRadius: 14,
        elevation: 10,
      },
      headerShown: false,
      tabBarButton: HapticTab,
      tabBarLabelStyle: { fontFamily: Fonts?.sans, fontSize: 10, fontWeight: '700' },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: ({ color }) => <IconSymbol size={25} name="house.fill" color={color} /> }} />
      <Tabs.Screen name="opportunities" options={{ title: 'Opportunités', tabBarIcon: ({ color }) => <IconSymbol size={25} name="target" color={color} /> }} />
      <Tabs.Screen name="execution-pack" options={{ title: 'Documents', tabBarIcon: ({ color }) => <IconSymbol size={25} name="doc.text.fill" color={color} /> }} />
      <Tabs.Screen name="progress" options={{ title: 'Suivi', tabBarIcon: ({ color }) => <IconSymbol size={25} name="checklist" color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: ({ color }) => <IconSymbol size={25} name="person.crop.circle" color={color} /> }} />
    </Tabs>
  );
}
