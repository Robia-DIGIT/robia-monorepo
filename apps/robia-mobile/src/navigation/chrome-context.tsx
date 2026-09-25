import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';
const ChromeContext = createContext({ tabBarHeight: 76, setTabBarHeight: (_height: number) => {} });
export function NavigationChromeProvider({ children }: PropsWithChildren) {
  const [tabBarHeight, setTabBarHeight] = useState(76);
  const value = useMemo(() => ({ tabBarHeight, setTabBarHeight }), [tabBarHeight]);
  return <ChromeContext.Provider value={value}>{children}</ChromeContext.Provider>;
}
export const useNavigationChrome = () => useContext(ChromeContext);
