import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// The last logo layer reaches its resting pose at this point in the timeline.
export const LOGO_SETTLED_PROGRESS = 0.72;
const LOGO_DURATION_MS = 1800;
const FADE_DURATION_MS = 220;

export function useLaunchAnimation(reduceMotion: boolean) {
  const [visible, setVisible] = useState(true);
  const progress = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const completed = useRef(false);

  const finish = useCallback(() => {
    if (completed.current) return;
    completed.current = true;
    progress.stopAnimation();
    opacity.stopAnimation();
    opacity.setValue(0);
    setVisible(false);
    void SplashScreen.hideAsync().catch(() => {});
  }, [opacity, progress]);

  useEffect(() => {
    if (completed.current) return;
    if (reduceMotion) {
      progress.setValue(LOGO_SETTLED_PROGRESS);
      finish();
      return;
    }

    // Keep the entrance easing separate from the fade: its slow tail must not
    // leave a translucent logo over the application after the movement ends.
    const animation = Animated.sequence([
      Animated.timing(progress, {
        toValue: LOGO_SETTLED_PROGRESS,
        duration: LOGO_DURATION_MS,
        easing: Easing.bezier(0.22, 0.72, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_DURATION_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]);
    animation.start(({ finished }) => { if (finished) finish(); });
    const fallback = setTimeout(finish, LOGO_DURATION_MS + FADE_DURATION_MS + 1000);
    return () => {
      animation.stop();
      clearTimeout(fallback);
    };
  }, [finish, opacity, progress, reduceMotion]);

  const reveal = useCallback(() => {
    void SplashScreen.hideAsync().catch(() => {});
  }, []);

  return { visible, progress, opacity, reveal };
}
