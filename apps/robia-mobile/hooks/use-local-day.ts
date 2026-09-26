import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
// Refresh date buckets at local midnight and when returning to the app.
export function useLocalDay() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const current = new Date();
    const next = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1);
    const timer = setTimeout(() => setNow(new Date()), Math.max(1000, next.getTime() - current.getTime() + 100));
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') setNow(new Date()); });
    return () => { clearTimeout(timer); subscription.remove(); };
  }, [now]);
  return now;
}
