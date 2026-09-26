import { createContext, useContext } from 'react';
import type { PanGesture } from 'react-native-gesture-handler';
export const SectionGestureContext = createContext<PanGesture | undefined>(undefined);
export const useSectionGesture = () => useContext(SectionGestureContext);
