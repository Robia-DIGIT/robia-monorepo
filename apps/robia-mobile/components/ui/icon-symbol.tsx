import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import type { ComponentProps } from 'react';
const SYMBOLS = {
  'house.fill': 'home', 'person.3.fill': 'social', 'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code', 'chevron.right': 'chevron',
  'lightbulb.fill': 'opportunity', 'doc.text.fill': 'document',
  'chart.bar.fill': 'analytics', 'person.crop.circle.fill': 'profile',
} as const satisfies Record<string, AppIconName>;
type Props = Omit<ComponentProps<typeof AppIcon>, 'name'> & { name: keyof typeof SYMBOLS };
// Compatibility for existing generic components; uses the same family on Android and iOS.
export function IconSymbol({ name, ...props }: Props) {
  return <AppIcon {...props} name={SYMBOLS[name]} />;
}
