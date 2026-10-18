import { describe, expect, it, vi } from 'vitest';
import { createPingLimiter, createSonar, pingParams } from '../../src/sound/sonar';

describe('pingParams', () => {
  it('rises in pitch and gain with severity and stays quiet (gain below 0.15)', () => {
    const f = [1, 2, 3, 4, 5].map((s) => pingParams(s, 0).freq);
    for (let i = 1; i < f.length; i++) expect(f[i]!).toBeGreaterThan(f[i - 1]!);
    expect(f[0]).toBeCloseTo(220, 1);
    expect(pingParams(1, 0).gain).toBeLessThan(pingParams(5, 0).gain);
    expect(pingParams(5, 0).gain).toBeLessThan(0.15);
  });
  it('pans from hard left at -180 to hard right at +180 and clamps', () => {
    expect(pingParams(3, -180).pan).toBe(-1);
    expect(pingParams(3, 180).pan).toBe(1);
    expect(pingParams(3, 0).pan).toBe(0);
    expect(pingParams(3, 400).pan).toBe(1);
  });
  it('treats non-finite input as severity 1 and centre', () => {
    expect(pingParams(NaN, NaN)).toEqual(pingParams(1, 0));
    expect(pingParams(9, 0).freq).toBe(pingParams(5, 0).freq);
  });
});

describe('createPingLimiter', () => {
  it('allows 6 pings in a second, refuses the 7th, and allows again later', () => {
    let t = 0;
    const allow = createPingLimiter(6, () => t);
    for (let i = 0; i < 6; i++) expect(allow()).toBe(true);
    expect(allow()).toBe(false);
    t = 999;
    expect(allow()).toBe(false);
    t = 1001;
    expect(allow()).toBe(true);
  });
});

const fakeCtx = (opts: { panner?: boolean } = { panner: true }) => {
  const nodes: { disconnect: ReturnType<typeof vi.fn>; connect: ReturnType<typeof vi.fn>; onended?: () => void }[] = [];
  const node = () => {
    const n = { connect: vi.fn((x: unknown) => x), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn(), frequency: { value: 0 }, type: '', onended: undefined as undefined | (() => void),
      gain: { value: 0, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, pan: { value: 0 } };
    nodes.push(n);
    return n;
  };
  const ctx: Record<string, unknown> = {
    currentTime: 1, state: 'running', destination: {}, createOscillator: node, createGain: node, resume: vi.fn(async () => {}), close: vi.fn(async () => {}),
  };
  if (opts.panner) ctx.createStereoPanner = node;
  return { ctx, nodes };
};

describe('createSonar', () => {
  it('creates no audio context until the first ping or unlock', () => {
    const factory = vi.fn(() => fakeCtx().ctx as never);
    const s = createSonar(factory);
    expect(factory).not.toHaveBeenCalled();
    s.ping(3, 10);
    expect(factory).toHaveBeenCalledTimes(1);
    s.ping(4, 10);
    expect(factory).toHaveBeenCalledTimes(1);
  });
  it('disconnects its nodes when a ping ends', () => {
    const { ctx, nodes } = fakeCtx();
    createSonar(() => ctx as never).ping(5, -90);
    const osc = nodes[0]!;
    osc.onended?.();
    for (const n of nodes) expect(n.disconnect).toHaveBeenCalled();
  });
  it('works without a stereo panner', () => {
    const { ctx } = fakeCtx({ panner: false });
    expect(() => createSonar(() => ctx as never).ping(2, 50)).not.toThrow();
  });
  it('resumes a suspended context, ignores a failing factory, and closes on dispose', () => {
    const { ctx } = fakeCtx();
    ctx.state = 'suspended';
    const s = createSonar(() => ctx as never);
    s.ping(1, 0);
    expect(ctx.resume).toHaveBeenCalled();
    s.dispose();
    expect(ctx.close).toHaveBeenCalled();
    expect(() => createSonar(() => { throw new Error('no audio'); }).ping(1, 0)).not.toThrow();
  });
});
