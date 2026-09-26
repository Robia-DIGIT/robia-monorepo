import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { APP_ICONS, type AppIconName } from '@/constants/icons';
import { Brand } from '@/constants/theme';
export type { AppIconName } from '@/constants/icons';

type Props = Omit<ComponentProps<typeof Ionicons>, 'name'> & { name: AppIconName; selected?: boolean };
// Controls own their spoken labels; their decorative glyphs must not be read twice.
export function AppIcon({ name, selected = false, size = 22, color = Brand.slate500, style, accessibilityLabel, accessible, ...props }: Props) {
  const spoken = accessible ?? !!accessibilityLabel;
  return <Ionicons {...props} name={APP_ICONS[name][selected ? 1 : 0]} size={size} color={color}
    accessible={spoken} accessibilityLabel={accessibilityLabel} accessibilityElementsHidden={!spoken}
    importantForAccessibility={spoken ? 'auto' : 'no-hide-descendants'} allowFontScaling={false}
    style={[{ flexShrink: 0, textAlign: 'center', textAlignVertical: 'center' }, style]} />;
}
