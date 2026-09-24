import { IconSymbol } from "@/components/ui/icon-symbol";
import { Brand, Fonts } from "@/constants/theme";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { PlatformPressable } from "@react-navigation/elements";
import {
    type MaterialTopTabBarProps,
    type MaterialTopTabNavigationEventMap,
    type MaterialTopTabNavigationOptions,
} from "@react-navigation/material-top-tabs";
import {
    type ParamListBase,
    type TabNavigationState,
    useLinkBuilder,
} from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { withLayoutContext } from "expo-router";
import { useEffect, useRef } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SwipeTabNavigator } from '@/components/swipe-tab-navigator';
const SwipeTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof SwipeTabNavigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(SwipeTabNavigator);

const TABS = [
  { name: "dashboard", title: "Accueil", icon: "house.fill" },
  { name: "opportunities", title: "Opportunité", icon: "lightbulb.fill" },
  { name: "work", title: "Travail", icon: "doc.text.fill" },
  { name: "programs", title: "Candidatures", icon: "person.crop.circle.fill" },
  { name: "profile", title: "Entreprise", icon: "person.crop.circle.fill" },
] as const;

// Use the navigator's selected route as the only source of selection. The
// default tab bar cross-fades two icon trees, which conflicts with icon-level
// entering/exiting animations, especially when jumping over several pages.
export function RobiaTabBar({
  state,
  descriptors,
  navigation,
}: MaterialTopTabBarProps) {
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const { buildHref } = useLinkBuilder();
  const scroll = useRef<ScrollView>(null);
  const shouldScroll = fontScale > 1.15 || width < 360;
  const itemWidth = shouldScroll
    ? 104 * fontScale
    : (width - 32) / state.routes.length;

  useEffect(() => {
    if (shouldScroll) {
      scroll.current?.scrollTo({
        x: Math.max(0, state.index * itemWidth - (width - 32 - itemWidth) / 2),
        animated: !reduceMotion,
      });
    }
  }, [itemWidth, reduceMotion, shouldScroll, state.index, width]);

  return (
    <View style={[styles.bar, { marginBottom: Math.max(insets.bottom, 10) }]}>
      <ScrollView
        ref={scroll}
        horizontal
        scrollEnabled={shouldScroll}
        showsHorizontalScrollIndicator={shouldScroll}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.items}
      >
        {state.routes.map((route, index) => {
          const tab = TABS.find((item) => item.name === route.name);
          const options = descriptors[route.key].options;
          const selected = state.index === index;
          const label = options.title ?? route.name;
          return (
            <PlatformPressable
              key={route.key}
              href={buildHref(route.name, route.params)}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected }}
              testID={`tab-${route.name}`}
              pressOpacity={0.85}
              pressColor={Brand.tealLight}
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (selected || event.defaultPrevented) return;
                navigation.navigate(route.name, route.params);
                void Haptics.selectionAsync().catch(() => {});
              }}
              onLongPress={() =>
                navigation.emit({ type: "tabLongPress", target: route.key })
              }
              style={[styles.item, { width: itemWidth }]}
            >
              <View
                accessible={false}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={[styles.icon, selected && styles.iconSelected]}
              >
                <IconSymbol
                  name={tab?.icon ?? "house.fill"}
                  size={23}
                  color={selected ? Brand.tealDark : Brand.slate500}
                />
              </View>
              <Text style={[styles.label, selected && styles.labelSelected]}>
                {label}
              </Text>
              <View style={[styles.dot, { opacity: selected ? 1 : 0 }]} />
            </PlatformPressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function TabLayout() {
  return (
    <SwipeTabs
      initialRouteName="dashboard"
      backBehavior="history"
      tabBarPosition="bottom"
      tabBar={RobiaTabBar}
      screenOptions={{
        sceneStyle: { backgroundColor: "#FBFCFC" },
      }}
    >
      {TABS.map((tab) => (
        <SwipeTabs.Screen
          key={tab.name}
          name={tab.name}
          options={{ title: tab.title }}
        />
      ))}
    </SwipeTabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: Brand.white,
    shadowColor: Brand.navyDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    overflow: "hidden",
  },
  items: { alignItems: "stretch" },
  item: {
    minHeight: 76,
    paddingVertical: 8,
    paddingHorizontal: 2,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  icon: {
    width: 40,
    height: 30,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  iconSelected: { backgroundColor: Brand.tealLight },
  label: {
    color: Brand.slate500,
    fontFamily: Fonts.sans,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    fontWeight: "600",
  },
  labelSelected: { color: Brand.tealDark, fontWeight: "800" },
  dot: {
    width: 5,
    height: 3,
    borderRadius: 2,
    backgroundColor: Brand.tealDark,
  },
});
