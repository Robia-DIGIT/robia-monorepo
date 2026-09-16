import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** Synchronise les animations de l'application avec le réglage système. */
export function useReducedMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReduceMotion(enabled);
      })
      .catch(() => {});

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}
