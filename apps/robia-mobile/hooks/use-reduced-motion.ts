import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** Synchronise les animations de l'application avec le réglage système. */
export function useReducedMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    let receivedChange = false;
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        receivedChange = true;
        setReduceMotion(enabled);
      },
    );

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted && !receivedChange) setReduceMotion(enabled);
      })
      .catch(() => {});

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}
