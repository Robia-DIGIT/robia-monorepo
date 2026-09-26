import {
  TabRouter,
  useNavigationBuilder,
  type ParamListBase,
  type TabActionHelpers,
  type TabNavigationState,
  type TabRouterOptions,
} from '@react-navigation/native';
import type {
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationOptions,
  MaterialTopTabNavigatorProps,
} from '@react-navigation/material-top-tabs';
import type { Href } from 'expo-router';
import { useLayoutEffect, useMemo, useState } from 'react';
import { Animated, StyleSheet, View, useWindowDimensions } from 'react-native';

import { useFilterMotion } from '@/hooks/use-filter-motion';
import { TabSwipeContext } from '@/src/navigation/tab-swipe-context';

// React Navigation retains route identity, history, deep links and focus events.
// The track is shared with each screen so boundary drags move real sibling pages.
export function SwipeTabNavigator({
  id, initialRouteName, backBehavior, UNSTABLE_routeNamesChangeBehavior,
  children, layout, screenListeners, screenOptions, screenLayout, UNSTABLE_router,
  tabBar,
}: MaterialTopTabNavigatorProps) {
  const { state, descriptors, navigation, NavigationContent } = useNavigationBuilder<
    TabNavigationState<ParamListBase>, TabRouterOptions, TabActionHelpers<ParamListBase>,
    MaterialTopTabNavigationOptions, MaterialTopTabNavigationEventMap
  >(TabRouter, {
    id, initialRouteName, backBehavior, UNSTABLE_routeNamesChangeBehavior,
    children, layout, screenListeners, screenOptions, screenLayout, UNSTABLE_router,
  });
  const dimensions = useWindowDimensions();
  const [size, setSize] = useState({ width: dimensions.width, height: 0 });
  const { motion, reduceMotion } = useFilterMotion();
  const [prepared, setPrepared] = useState(() => ({
    index: state.index,
    keys: new Set(state.routes.filter((_, index) => Math.abs(index - state.index) <= 1).map(route => route.key)),
  }));
  let loaded = prepared.keys;
  if (prepared.index !== state.index) {
    // Mount the entire path before paint, including jumps made with the navbar.
    // Previously visited screens keep their filters and vertical scroll positions.
    const first = Math.min(prepared.index, state.index) - 1;
    const last = Math.max(prepared.index, state.index) + 1;
    loaded = new Set([...loaded, ...state.routes.filter((_, index) => index >= first && index <= last).map(route => route.key)]);
    setPrepared({ index: state.index, keys: loaded });
  }
  const position = useMemo(() => motion.position.interpolate({
    inputRange: [0, 1], outputRange: [0, 1],
  }), [motion]);

  useLayoutEffect(() => {
    motion.configure(state.index, size.width, reduceMotion);
  }, [motion, reduceMotion, size.width, state.index]);


  return (
    <NavigationContent>
      <View style={styles.container}>
        <View style={styles.viewport} onLayout={({ nativeEvent }) => {
          const { width, height } = nativeEvent.layout;
          setSize(previous => previous.width === width && previous.height === height ? previous : { width, height });
        }}>
          <Animated.View collapsable={false} style={[
            styles.track,
            { width: size.width * state.routes.length, transform: [{ translateX: motion.offset }] },
          ]}>
            {state.routes.map((route, index) => {
              const active = index === state.index;
              const render = loaded.has(route.key) || Math.abs(index - state.index) <= 1 ||
                state.preloadedRouteKeys.includes(route.key);
              return (
                <View key={route.key} collapsable={false}
                  pointerEvents={active ? 'auto' : 'none'}
                  accessibilityElementsHidden={!active}
                  importantForAccessibility={active ? 'auto' : 'no-hide-descendants'}
                  style={[styles.page, descriptors[route.key].options.sceneStyle, { width: size.width }]}>
                  <TabSwipeContext.Provider value={{
                    motion,
                    previousTab: index > 0 ? ('/(tabs)/' + state.routes[index - 1].name) as Href : null,
                    nextTab: index < state.routes.length - 1 ? ('/(tabs)/' + state.routes[index + 1].name) as Href : null,
                  }}>
                    {render ? descriptors[route.key].render() : null}
                  </TabSwipeContext.Provider>
                </View>
              );
            })}
          </Animated.View>
        </View>
        {tabBar?.({
          state, descriptors, navigation, position, layout: size,
          jumpTo: key => {
            const route = state.routes.find(item => item.key === key);
            if (route) navigation.navigate(route.name, route.params);
          },
        })}
      </View>
    </NavigationContent>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFCFC' },
  viewport: { flex: 1, overflow: 'hidden' },
  track: { flex: 1, flexDirection: 'row' },
  page: { height: '100%', flexShrink: 0, overflow: 'hidden' },
});
