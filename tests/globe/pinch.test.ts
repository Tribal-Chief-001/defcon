import { describe, expect, it } from 'vitest';
import { createPinch } from '../../src/globe/pinch';

describe('createPinch', () => {
  it('is inactive and returns null with fewer than two fingers', () => {
    const p = createPinch();
    expect(p.active()).toBe(false);
    p.down(1, 0, 0);
    expect(p.active()).toBe(false);
    expect(p.move(1, 10, 10)).toBeNull();
  });
  it('reports a scale above 1 when the fingers spread and below 1 when they pinch', () => {
    const p = createPinch();
    p.down(1, 0, 0);
    p.down(2, 100, 0);
    expect(p.active()).toBe(true);
    expect(p.move(2, 120, 0)!.scale).toBeCloseTo(1.2, 5);
    expect(p.move(2, 108, 0)!.scale).toBeCloseTo(0.9, 5); // relative to the previous event, not the start
  });
  it('clamps each event to 0.5..2', () => {
    const p = createPinch();
    p.down(1, 0, 0);
    p.down(2, 100, 0);
    expect(p.move(2, 1000, 0)!.scale).toBe(2);
    expect(p.move(2, 1, 0)!.scale).toBe(0.5);
  });
  it('ends when a finger lifts and can start again with re-used ids', () => {
    const p = createPinch();
    p.down(1, 0, 0);
    p.down(2, 100, 0);
    p.up(2);
    expect(p.active()).toBe(false);
    expect(p.move(1, 5, 5)).toBeNull();
    p.down(2, 50, 0);
    expect(p.active()).toBe(true);
    expect(p.move(2, 100, 0)!.scale).toBeCloseTo(2, 5);
  });
  it('returns null for a zero distance and ignores unknown pointers', () => {
    const p = createPinch();
    p.down(1, 0, 0);
    p.down(2, 0, 0);
    expect(p.move(2, 0, 0)).toBeNull();
    expect(p.move(9, 5, 5)).toBeNull();
    p.up(9);
  });
});
