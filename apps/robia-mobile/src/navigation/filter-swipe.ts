import type { Href } from 'expo-router';

export type FilterSwipeTarget =
  | { kind: 'filter'; value: string }
  | { kind: 'tab'; route: Href }
  | null;

export function getFilterSwipeTarget(
  filters: readonly string[],
  selected: string,
  direction: 'previous' | 'next',
  previousTab: Href | null,
  nextTab: Href | null,
): FilterSwipeTarget {
  const currentIndex = filters.indexOf(selected);
  if (currentIndex === -1) return null;

  const nextIndex = currentIndex + (direction === 'next' ? 1 : -1);
  if (nextIndex >= 0 && nextIndex < filters.length) {
    return { kind: 'filter', value: filters[nextIndex] };
  }

  const route = direction === 'next' ? nextTab : previousTab;
  return route ? { kind: 'tab', route } : null;
}
