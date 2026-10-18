import { useEffect, useState } from 'react';

// Unix seconds, refreshed on an interval so "2 h ago" labels and rolling windows do not freeze in a tab that stays open.
export function useNow(everyMs = 30_000): number {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = window.setInterval(() => setNow(Math.floor(Date.now() / 1000)), everyMs);
    return () => window.clearInterval(id);
  }, [everyMs]);
  return now;
}
