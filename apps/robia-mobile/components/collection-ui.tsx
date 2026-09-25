import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, type Href } from 'expo-router';
import { useMemo, type PropsWithChildren, type ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Brand } from '@/constants/theme';
import { useSectionGesture } from '@/src/navigation/section-gesture-context';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

type Icon = ComponentProps<typeof MaterialIcons>['name'];
export function CollectionRail({ children, snap }: PropsWithChildren<{ snap?: number }>) {
  const parent = useSectionGesture();
  const gesture = useMemo(() => {
    const native = Gesture.Native();
    return parent ? native.blocksExternalGesture(parent) : native;
  }, [parent]);
  return <GestureDetector gesture={gesture}><ScrollView horizontal nestedScrollEnabled
    keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false}
    snapToInterval={snap} decelerationRate={snap ? 'fast' : 'normal'}
    contentContainerStyle={c.rail}>{children}</ScrollView></GestureDetector>;
}
export function SearchBox({ value, onChange, placeholder }: { value: string; onChange(text: string): void; placeholder: string }) {
  return <View style={c.search}>
    <MaterialIcons name="search" size={22} color={Brand.slate500} />
    <TextInput accessibilityLabel={placeholder} placeholder={placeholder} value={value} onChangeText={onChange}
      autoCorrect={false} returnKeyType="search" placeholderTextColor={Brand.slate500} style={c.input} />
    {value ? <Pressable accessibilityRole="button" accessibilityLabel="Effacer la recherche" onPress={() => onChange('')} style={c.iconButton}>
      <MaterialIcons name="close" size={20} color={Brand.slate500} />
    </Pressable> : null}
  </View>;
}
export function FilterButton({ label, selected, onPress, count }: { label: string; selected: boolean; onPress(): void; count?: number }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress}
    style={({ pressed }) => [c.filter, selected && c.filterSelected, pressed && c.pressed]}>
    <Text style={[c.filterText, selected && { color: Brand.white }]}>{label}{count == null ? '' : ' · ' + count}</Text>
  </Pressable>;
}
export function CollectionHeading({ title, detail, action, onPress }: { title: string; detail?: string; action?: string; onPress?: () => void }) {
  return <View style={c.heading}><View style={{ flex: 1, minWidth: 0, gap: 3 }}>
    <Text accessibilityRole="header" style={c.title}>{title}</Text>{detail ? <Text style={c.caption}>{detail}</Text> : null}
  </View>{action && onPress ? <Pressable accessibilityRole="button" onPress={onPress} style={c.textButton}><Text style={c.link}>{action}</Text></Pressable> : null}</View>;
}
export function EmptyCollection({ title, message, action, onPress, icon = 'search-off' }: { title: string; message: string; action?: string; onPress?: () => void; icon?: Icon }) {
  return <View style={c.empty}><View style={c.emptyIcon}><MaterialIcons name={icon} size={30} color={Brand.tealDark} /></View>
    <Text style={[c.title, { textAlign: 'center' }]}>{title}</Text><Text style={[c.body, { textAlign: 'center' }]}>{message}</Text>
    {action && onPress ? <Pressable accessibilityRole="button" onPress={onPress} style={c.textButton}><Text style={c.link}>{action}</Text></Pressable> : null}
  </View>;
}
export function QuickActions({ items }: { items: readonly { label: string; icon: Icon; href: Href }[] }) {
  const { contentWidth, fontScale } = useResponsiveLayout();
  const columns = contentWidth / fontScale >= 320 ? 4 : contentWidth / fontScale >= 160 ? 2 : 1;
  const width = (contentWidth - (columns - 1) * 12) / columns;
  return <View style={c.grid}>{items.map(item => <Pressable key={item.label} accessibilityRole="button" accessibilityLabel={item.label}
    onPress={() => router.navigate(item.href)} style={({ pressed }) => [c.quick, { width }, pressed && c.pressed]}>
    <View style={c.quickIcon}><MaterialIcons name={item.icon} size={25} color={Brand.tealDark} /></View><Text style={c.quickLabel}>{item.label}</Text>
  </Pressable>)}</View>;
}
export const c = StyleSheet.create({
  stack: { gap: 18 }, rail: { flexDirection: 'row', gap: 10, paddingVertical: 2, alignItems: 'flex-start' },
  title: { fontSize: 19, lineHeight: 25, fontWeight: '800', color: Brand.navyDark },
  body: { fontSize: 14, lineHeight: 21, color: Brand.slate500 }, caption: { fontSize: 12, lineHeight: 18, color: Brand.slate500 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  textButton: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 4, flexShrink: 1 },
  link: { color: Brand.tealDark, fontSize: 13, fontWeight: '700' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 14, paddingRight: 4, borderRadius: 16, backgroundColor: '#EEF3F3' },
  input: { flex: 1, minWidth: 0, minHeight: 52, paddingVertical: 12, fontSize: 15, color: Brand.navyDark },
  iconButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  filter: { minHeight: 44, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 24, backgroundColor: '#EEF3F3', justifyContent: 'center' },
  filterSelected: { backgroundColor: Brand.navyDark }, filterText: { color: Brand.slate500, fontSize: 13, fontWeight: '700' },
  empty: { alignItems: 'center', gap: 10, padding: 24, borderRadius: 22, backgroundColor: Brand.surfaceSoft },
  emptyIcon: { width: 60, height: 60, borderRadius: 20, backgroundColor: Brand.tealLight, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quick: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  quickIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#E5F3EF', alignItems: 'center', justifyContent: 'center' },
  quickLabel: { textAlign: 'center', color: Brand.navyDark, fontSize: 12, lineHeight: 18, fontWeight: '600' },
  pressed: { opacity: .65 },
});
