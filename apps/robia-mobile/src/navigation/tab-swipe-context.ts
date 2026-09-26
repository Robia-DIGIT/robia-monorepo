import { createContext, useContext } from 'react';
import type { Href } from 'expo-router';
import type { FilterMotion } from '@/hooks/use-filter-motion';

export type TabSwipeController = {
  motion: FilterMotion;
  previousTab: Href | null;
  nextTab: Href | null;
};

export const TabSwipeContext = createContext<TabSwipeController | null>(null);
export const useTabSwipe = () => useContext(TabSwipeContext);
