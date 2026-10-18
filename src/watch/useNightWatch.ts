import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { fetchDetail } from '../events/detail';
import { useEvents } from '../events/store';
import { caption, initialWatch, nextState, watchTargets } from './nightWatch';

const nowS = () => Math.floor(Date.now() / 1000);

// Night Watch: after a quiet spell, fly to the most significant recent events one by one with a caption. `isBlocked` is polled every
// second: while it is true (a panel, the palette, time travel...) nothing starts and a running watch stops. Any input ends it.
export function useNightWatch(base: string, isBlocked: () => boolean) {
  const recent = useEvents((s) => s.recent);
  const [state, dispatch] = useReducer(nextState, undefined, () => initialWatch(nowS()));
  const blockedRef = useRef(isBlocked);
  blockedRef.current = isBlocked;

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.hidden) return;
      const blocked = blockedRef.current();
      dispatch({ type: 'blocked', value: blocked, nowS: nowS() });
      dispatch({ type: 'tick', nowS: nowS() });
    }, 1000);
    let last = { x: NaN, y: NaN };
    const input = () => dispatch({ type: 'input', nowS: nowS() });
    const move = (e: PointerEvent) => {
      if (Number.isFinite(last.x) && Math.hypot(e.clientX - last.x, e.clientY - last.y) <= 4) return;
      last = { x: e.clientX, y: e.clientY };
      input();
    };
    const evs: [string, EventListener][] = [['pointerdown', input], ['keydown', input], ['wheel', input], ['touchstart', input], ['pointermove', move as EventListener]];
    for (const [n, f] of evs) window.addEventListener(n, f, { passive: true });
    return () => {
      window.clearInterval(id);
      for (const [n, f] of evs) window.removeEventListener(n, f);
    };
  }, []);

  const watching = state.phase === 'watching';
  const targets = useMemo(() => (watching && recent ? watchTargets(recent, nowS()) : []), [watching, recent]);
  const current = targets.length ? targets[state.target % targets.length]! : undefined;

  const [place, setPlace] = useState('');
  useEffect(() => {
    if (!current || !recent) return setPlace('');
    let live = true;
    setPlace(current.country);
    void fetchDetail(base, 'recent', recent, current.index).then((d) => live && d?.place && setPlace(d.place));
    return () => {
      live = false;
    };
  }, [current, recent, base]);

  return {
    active: watching && !!current,
    caption: current ? caption({ place, timeS: current.timeS, kind: current.kind }) : '',
    focus: watching && current ? { lat: current.lat, lon: current.lon, distance: 1.9 } : null,
    marker: watching && current ? { lat: current.lat, lon: current.lon } : null,
  };
}
