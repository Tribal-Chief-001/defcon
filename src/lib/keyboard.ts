export type GlobeMove = { dYaw: number; dPitch: number; dZoom: number; home?: true };

const STEP = 0.08; // radians per arrow press; Shift triples it
const ZOOM = 0.12;

// Keyboard control of the globe: arrows move the view (right = east, up = north), + and - zoom, Home returns to the opening view.
// Keys combined with Ctrl, Meta or Alt are never taken (Ctrl+K belongs to the palette).
export function globeKey(e: { key: string; shiftKey: boolean; ctrlKey?: boolean; metaKey?: boolean; altKey?: boolean }): GlobeMove | null {
  if (e.ctrlKey || e.metaKey || e.altKey) return null;
  const s = e.shiftKey ? STEP * 3 : STEP;
  switch (e.key) {
    case 'ArrowLeft':
      return { dYaw: -s, dPitch: 0, dZoom: 0 };
    case 'ArrowRight':
      return { dYaw: s, dPitch: 0, dZoom: 0 };
    case 'ArrowUp':
      return { dYaw: 0, dPitch: s, dZoom: 0 };
    case 'ArrowDown':
      return { dYaw: 0, dPitch: -s, dZoom: 0 };
    case '+':
    case '=':
      return { dYaw: 0, dPitch: 0, dZoom: -ZOOM };
    case '-':
    case '_':
      return { dYaw: 0, dPitch: 0, dZoom: ZOOM };
    case 'Home':
      return { dYaw: 0, dPitch: 0, dZoom: 0, home: true };
    default:
      return null;
  }
}
