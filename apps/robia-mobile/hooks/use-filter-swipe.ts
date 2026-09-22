import { router, type Href } from 'expo-router';
import { useMemo, useRef } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { Gesture } from 'react-native-gesture-handler';

import { getFilterSwipeTarget } from '@/src/navigation/filter-swipe';

const ACTIVATION_DISTANCE = 18;
const COMMIT_DISTANCE = 48;

export function useFilterSwipe({
  filters,
  selected,
  onChange,
  previousTab,
  nextTab,
}: {
  filters: readonly string[];
  selected: string;
  onChange: (value: string) => void;
  previousTab: Href | null;
  nextTab: Href | null;
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
    .onEnd((gesture, success) => {
      if (!success) return;
      const distance = Math.abs(gesture.translationX);
      const isFlick = distance >= 24 && Math.abs(gesture.velocityX) >= 600 &&
        Math.sign(gesture.velocityX) === Math.sign(gesture.translationX);
      if (distance < COMMIT_DISTANCE && !isFlick) return;

      const { filters, selected, onChange, previousTab, nextTab } = latest.current;
      const target = getFilterSwipeTarget(
        filters,
        selected,
        gesture.translationX < 0 ? 'next' : 'previous',
        previousTab,
        nextTab,
      );
      if (target?.kind === 'filter') onChange(target.value);
      if (target?.kind === 'tab') router.navigate(target.route);
    }), [isFocused]);
}
