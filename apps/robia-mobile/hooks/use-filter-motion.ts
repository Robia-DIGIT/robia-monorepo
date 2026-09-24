import { useEffect, useMemo, useRef } from 'react';
import { Animated } from 'react-native';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

export function useFilterMotion() {
  const offset = useRef(new Animated.Value(0)).current;
  const width = useRef(0);
  const distance = useRef(0);
  const reduceMotion = useReducedMotion();
  const motion = useMemo(() => ({
    offset, width, distance, reduceMotion,
    move(value: number) {
      offset.stopAnimation();
      distance.current = reduceMotion ? 0 : value;
      offset.setValue(distance.current);
    },
    settle() {
      distance.current = 0;
      if (reduceMotion) { offset.setValue(0); return; }
      Animated.spring(offset, {
        toValue: 0, stiffness: 1000, damping: 500, mass: 3,
        overshootClamping: true, useNativeDriver: true,
      }).start();
    },
  }), [offset, reduceMotion]);
  useEffect(() => () => offset.stopAnimation(), [offset]);
  return motion;
}

export type FilterMotion = ReturnType<typeof useFilterMotion>;
