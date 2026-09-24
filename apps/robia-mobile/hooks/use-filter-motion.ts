import { useEffect, useMemo, useRef } from 'react';
import { Animated } from 'react-native';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

export function useFilterMotion() {
  const offset = useRef(new Animated.Value(0)).current;
  const width = useRef(0);
  const reduceMotion = useReducedMotion();
  const motion = useMemo(() => {
    let index = 0;
    let reduced = false;
    let dragging = false;
    let waitingForPosition = false;
    let dragStart = 0;
    let translation = 0;
    let revision = 0;

    const settle = () => {
      revision++;
      dragging = false;
      waitingForPosition = false;
      const target = -index * width.current;
      if (reduced) { offset.stopAnimation(); offset.setValue(target); return; }
      Animated.spring(offset, {
        toValue: target, stiffness: 1000, damping: 500, mass: 3,
        overshootClamping: true, useNativeDriver: true,
      }).start();
    };

    return {
      offset, width,
      configure(nextIndex: number, nextWidth: number, nextReduced: boolean) {
        const resized = width.current !== nextWidth;
        const changed = index !== nextIndex || reduced !== nextReduced;
        index = nextIndex;
        reduced = nextReduced;
        width.current = nextWidth;
        if (resized) {
          revision++;
          dragging = false;
          waitingForPosition = false;
          offset.stopAnimation();
          offset.setValue(-index * nextWidth);
        } else if (changed) {
          // Continue from the actual position, even when a slide is interrupted.
          // Page layout coordinates remain fixed when selection changes.
          settle();
        }
      },
      begin() {
        dragging = true;
        waitingForPosition = true;
        translation = 0;
        const request = ++revision;
        offset.stopAnimation((position) => {
          if (request !== revision || !dragging) return;
          dragStart = position;
          waitingForPosition = false;
          if (!reduced) offset.setValue(dragStart + translation);
        });
      },
      move(value: number) {
        translation = value;
        if (dragging && !waitingForPosition && !reduced) {
          offset.setValue(dragStart + translation);
        }
      },
      cancel() {
        // Failed vertical gestures and taps must not interrupt a running slide.
        if (dragging) settle();
      },
      settle,
      dispose() {
        revision++;
        dragging = false;
        offset.stopAnimation();
      },
    };
  }, [offset]);

  useEffect(() => () => motion.dispose(), [motion]);
  return { motion, reduceMotion };
}

export type FilterMotion = ReturnType<typeof useFilterMotion>['motion'];
