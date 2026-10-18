import { describe, expect, it } from 'vitest';
import { globeKey } from '../../src/lib/keyboard';

const k = (key: string, shiftKey = false, mods: { ctrlKey?: boolean; metaKey?: boolean; altKey?: boolean } = {}) => globeKey({ key, shiftKey, ...mods });

describe('globeKey', () => {
  it('rotates with the arrow keys, 0.08 rad, 0.24 with Shift', () => {
    expect(k('ArrowLeft')).toEqual({ dYaw: -0.08, dPitch: 0, dZoom: 0 });
    expect(k('ArrowRight')).toEqual({ dYaw: 0.08, dPitch: 0, dZoom: 0 });
    expect(k('ArrowUp')).toEqual({ dYaw: 0, dPitch: 0.08, dZoom: 0 });
    expect(k('ArrowDown', true)).toEqual({ dYaw: 0, dPitch: -0.24, dZoom: 0 });
  });
  it('zooms in with + and =, out with -, by 12 percent', () => {
    expect(k('+')!.dZoom).toBeCloseTo(-0.12);
    expect(k('=')!.dZoom).toBeCloseTo(-0.12);
    expect(k('-')!.dZoom).toBeCloseTo(0.12);
  });
  it('maps Home to the home view and ignores everything else', () => {
    expect(k('Home')).toEqual({ home: true, dYaw: 0, dPitch: 0, dZoom: 0 });
    expect(k('a')).toBeNull();
    expect(k('Tab')).toBeNull();
    expect(k('Enter')).toBeNull();
  });
  it('never takes a key combined with Ctrl, Meta or Alt (Ctrl+K belongs to the palette)', () => {
    expect(k('ArrowLeft', false, { ctrlKey: true })).toBeNull();
    expect(k('+', false, { metaKey: true })).toBeNull();
    expect(k('Home', false, { altKey: true })).toBeNull();
  });
});
