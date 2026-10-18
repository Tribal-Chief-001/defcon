import { describe, expect, it } from 'vitest';
import { createClickClassifier } from '../../src/globe/gesture';

describe('createClickClassifier', () => {
  it('treats press and release without movement as a click', () => {
    const c = createClickClassifier();
    c.down();
    expect(c.up()).toBe(true);
  });
  it('treats small movement (under 5 px total) as a click', () => {
    const c = createClickClassifier();
    c.down();
    c.move(2, 2);
    expect(c.up()).toBe(true);
  });
  it('treats movement of 5 px or more as a drag, not a click', () => {
    const c = createClickClassifier();
    c.down();
    c.move(3, 3);
    expect(c.up()).toBe(false);
  });
  // review finding: a cancelled touch (pointercancel) must never select a country
  it('never reports a click after cancel', () => {
    const c = createClickClassifier();
    c.down();
    c.cancel();
    expect(c.up()).toBe(false);
  });
  it('reports no click for a release without a press', () => {
    expect(createClickClassifier().up()).toBe(false);
  });
  it('resets between gestures', () => {
    const c = createClickClassifier();
    c.down();
    c.move(50, 0);
    expect(c.up()).toBe(false);
    c.down();
    expect(c.up()).toBe(true);
  });
});
