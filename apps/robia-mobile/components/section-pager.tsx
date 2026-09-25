import { SectionGestureContext } from '@/src/navigation/section-gesture-context';
import { router, useLocalSearchParams } from 'expo-router';
import type { ReactNode } from 'react';
import { FilterChips, FilterTransition, RobiaFixedHeader, RobiaScreen } from '@/components/robia-ui';
import { WorkspaceHeader } from '@/components/workspace-header';
import { useFilterMotion } from '@/hooks/use-filter-motion';
import { useFilterSwipe } from '@/hooks/use-filter-swipe';
import { resolveSection } from '@/src/navigation/sections';

type Section = { readonly id: string; readonly label: string };
export function SectionPager({ title, sections, children, refreshing, onRefresh }: {
  title: string; sections: readonly Section[]; children(section: string): ReactNode;
  refreshing?: boolean; onRefresh?: () => Promise<unknown>;
}) {
  const { section } = useLocalSearchParams<{ section?: string | string[] }>();
  const selected = resolveSection(sections, section);
  const setSelected = (value: string) => router.setParams({ section: value });
  const options = sections.map(item => item.id);
  const labels = Object.fromEntries(sections.map(item => [item.id, item.label]));
  const { motion, reduceMotion } = useFilterMotion();
  const gesture = useFilterSwipe({ filters: options, selected, onChange: setSelected,
    previousTab: null, nextTab: null, motion });
  return <RobiaScreen fixedHeader scroll={false} swipeGesture={gesture}
    contentStyle={{ paddingHorizontal: 0, paddingTop: 0, paddingBottom: 0, gap: 0 }}>
    <RobiaFixedHeader>
      <WorkspaceHeader title={title} />
      <FilterChips options={options} labels={labels} selected={selected} onChange={setSelected}
        motion={motion} scrollGesture={gesture} />
    </RobiaFixedHeader>
    <FilterTransition options={options} filterKey={selected} motion={motion} reduceMotion={reduceMotion}
      swipeGesture={gesture} refreshing={refreshing} onRefresh={onRefresh}>{id => <SectionGestureContext.Provider value={gesture}>{children(id)}</SectionGestureContext.Provider>}</FilterTransition>
  </RobiaScreen>;
}
