import { router, type Href } from 'expo-router';
import { useMemo, useRef } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { Gesture } from 'react-native-gesture-handler';

import type { FilterMotion } from '@/hooks/use-filter-motion';

import { getFilterSwipeTarget } from '@/src/navigation/filter-swipe';

const ACTIVATION_DISTANCE = 18;
const COMMIT_DISTANCE = 48;

export function useFilterSwipe({
  filters,
  selected,
  onChange,
  previousTab,
  nextTab,
  motion,
}: {
  filters: readonly string[];
  selected: string;
  onChange: (value: string) => void;
  previousTab: Href | null;
  nextTab: Href | null;
  motion?: FilterMotion;
}) {
  const isFocused = useIsFocused();
  const latest = useRef({ filters, selected, onChange, previousTab, nextTab });
  latest.current = { filters, selected, onChange, previousTab, nextTab };

  return useMemo(() => Gesture.Pan()
    .enabled(isFocused)
    .maxPointers(1)
    .activeOffsetX([-ACTIVATION_DISTANCE, ACTIVATION_DISTANCE])
    .failOffsetY([-14, 14])
    .runOnJS(true)
    .onStart(() => motion?.begin())
    .onUpdate((gesture) => {
      if (!motion) return;
      const { filters, selected } = latest.current;
      const index = filters.indexOf(selected);
      const value = gesture.translationX;
      // Retain adjacent-tab navigation at the boundaries, with resistance.
      const atEdge = (index === 0 && value > 0) ||
        (index === filters.length - 1 && value < 0);
      const width = motion.width.current;
      motion.move(atEdge ? value * 0.15 : Math.max(-width, Math.min(width, value)));
    })
    .onFinalize((_gesture, success) => {
      if (!success) motion?.cancel();
    })
    .onEnd((gesture, success) => {
      if (!success) { motion?.cancel(); return; }
      const distance = Math.abs(gesture.translationX);
      const isFlick = distance >= 24 && Math.abs(gesture.velocityX) >= 600 &&
        Math.sign(gesture.velocityX) === Math.sign(gesture.translationX);
      if (distance < COMMIT_DISTANCE && !isFlick) { motion?.settle(); return; }

      const { filters, selected, onChange, previousTab, nextTab } = latest.current;
      const target = getFilterSwipeTarget(
        filters,
        selected,
        gesture.translationX < 0 ? 'next' : 'previous',
        previousTab,
        nextTab,
      );
      if (target?.kind === 'filter') onChange(target.value);
      if (target?.kind !== 'filter') motion?.settle();
      if (target?.kind === 'tab') router.navigate(target.route);
    }), [isFocused, motion]);
}
