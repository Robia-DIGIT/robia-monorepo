import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { responsiveLayout } from '@/src/navigation/responsive-layout';
export function useResponsiveLayout() {
  const { width, height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return { ...responsiveLayout(width, height, fontScale, insets), fontScale, insets };
}
