import { describe, expect, it } from 'vitest';
import { framingFor } from '../../src/globe/framing';

// The dossier covers the left side on desktop and the lower part on narrow screens; the globe is shifted so the dived
// country stays in the visible part.
describe('framingFor', () => {
  it('does not shift the globe when no panel is open', () => {
    expect(framingFor(false, false)).toEqual({ x: 0, y: 0 });
    expect(framingFor(false, true)).toEqual({ x: 0, y: 0 });
  });
  it('shifts right on desktop and up on a narrow screen when a panel is open', () => {
    expect(framingFor(true, false)).toEqual({ x: 0.17, y: 0 });
    expect(framingFor(true, true)).toEqual({ x: 0, y: 0.2 });
  });
  it('shifts left on desktop (the War room is docked on the right) and up on a narrow screen (a bottom sheet) while the war room is open', () => {
    expect(framingFor(false, false, true)).toEqual({ x: -0.2, y: 0 });
    expect(framingFor(false, true, true)).toEqual({ x: 0, y: 0.22 });
    expect(framingFor(true, false, true)).toEqual({ x: -0.2, y: 0 }); // the war room wins over a dossier
  });
});

