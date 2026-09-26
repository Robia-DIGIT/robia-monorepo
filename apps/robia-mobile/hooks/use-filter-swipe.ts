import { router, type Href } from 'expo-router';
import { useMemo, useRef } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { Gesture } from 'react-native-gesture-handler';

import type { FilterMotion } from '@/hooks/use-filter-motion';
import { getFilterSwipeTarget } from '@/src/navigation/filter-swipe';
import { useTabSwipe } from '@/src/navigation/tab-swipe-context';

const ACTIVATION_DISTANCE = 18;
const COMMIT_DISTANCE = 48;

export function useFilterSwipe({
  filters, selected, onChange, previousTab, nextTab, motion, enabled = true,
}: {
  filters: readonly string[];
  selected: string;
  onChange: (value: string) => void;
  previousTab: Href | null;
  nextTab: Href | null;
  motion?: FilterMotion;
  enabled?: boolean;
}) {
  const isFocused = useIsFocused();
  const pager = useTabSwipe();
  const tabMotion = pager?.motion;
  const latest = useRef({ filters, selected, onChange, previousTab, nextTab });
  latest.current = {
    filters, selected, onChange,
    previousTab: pager ? pager.previousTab : previousTab,
    nextTab: pager ? pager.nextTab : nextTab,
  };

  return useMemo(() => {
    let driver: FilterMotion | undefined;
    const targetFor = (translation: number) => {
      const { filters, selected, previousTab, nextTab } = latest.current;
      return getFilterSwipeTarget(filters, selected, translation < 0 ? 'next' : 'previous', previousTab, nextTab);
    };
    const update = (translation: number) => {
      const target = targetFor(translation);
      const nextDriver = target?.kind === 'tab' ? tabMotion : target?.kind === 'filter' ? motion : undefined;
      if (driver !== nextDriver) {
        // Crossing the starting point can switch between a filter and a tab.
        driver?.resetToSelected();
        driver = nextDriver;
        driver?.begin();
      }
      if (driver) {
        const width = driver.width.current;
        driver.move(Math.max(-width, Math.min(width, translation)));
      }
      return target;
    };
    const cancel = () => {
      driver?.cancel();
      driver = undefined;
    };

    return Gesture.Pan()
      .enabled(isFocused && enabled)
      .maxPointers(1)
      .activeOffsetX([-ACTIVATION_DISTANCE, ACTIVATION_DISTANCE])
      .failOffsetY([-14, 14])
      .runOnJS(true)
      .onStart(gesture => { update(gesture.translationX); })
      .onUpdate(gesture => { update(gesture.translationX); })
      .onFinalize((_gesture, success) => { if (!success) cancel(); })
      .onEnd((gesture, success) => {
        if (!success) { cancel(); return; }
        const target = update(gesture.translationX);
        const distance = Math.abs(gesture.translationX);
        const isFlick = distance >= 24 && Math.abs(gesture.velocityX) >= 600 &&
          Math.sign(gesture.velocityX) === Math.sign(gesture.translationX);
        if (distance < COMMIT_DISTANCE && !isFlick) {
          driver?.settle();
        } else if (target?.kind === 'filter') {
          latest.current.onChange(target.value);
        } else if (target?.kind === 'tab') {
          // The parent is already at the finger's position; route selection only
          // completes that slide. Never reset it before changing the route.
          motion?.resetToSelected();
          router.navigate(target.route);
        } else {
          driver?.settle();
        }
        driver = undefined;
      });
  }, [enabled, isFocused, motion, tabMotion]);
}
