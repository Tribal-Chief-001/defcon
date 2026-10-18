// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { errorLog, installGlobalHandlers } from '../../src/lib/errorLog';

beforeEach(() => errorLog.clear());

describe('errorLog', () => {
  it('records message and place, newest last, and keeps at most 20', () => {
    for (let i = 0; i < 25; i++) errorLog.record(new Error(`boom ${i}`), 'panel');
    const e = errorLog.entries();
    expect(e).toHaveLength(20);
    expect(e[0]!.message).toBe('boom 5');
    expect(e.at(-1)!.message).toBe('boom 24');
    expect(e[0]!.where).toBe('panel');
  });
  it('truncates long messages to 200 characters and strips query strings and fragments from URLs', () => {
    errorLog.record(new Error('x'.repeat(500)), 'a');
    expect(errorLog.entries()[0]!.message.length).toBeLessThanOrEqual(200);
    errorLog.record(new Error('failed https://example.com/data/events/recent.bin?v=abc123&token=secret#frag now'), 'b');
    const m = errorLog.entries().at(-1)!.message;
    expect(m).toContain('https://example.com/data/events/recent.bin');
    expect(m).not.toMatch(/token|secret|\?v=|#frag/);
  });
  it('accepts non-Error values without throwing', () => {
    errorLog.record('just a string', 'a');
    errorLog.record({ weird: true }, 'a');
    errorLog.record(null, 'a');
    errorLog.record(undefined, 'a');
    expect(errorLog.entries()).toHaveLength(4);
    expect(errorLog.entries().every((e) => typeof e.message === 'string')).toBe(true);
  });
  it('formats entries as plain text lines and never dumps objects', () => {
    errorLog.record(new Error('one'), 'dossier');
    const text = errorLog.format();
    expect(text).toMatch(/dossier: one/);
    expect(text).not.toMatch(/\[object Object\]|\{/);
    errorLog.clear();
    expect(errorLog.format()).toMatch(/no errors/i);
  });
  it('records window errors and unhandled rejections once handlers are installed, and installs only once', () => {
    installGlobalHandlers();
    installGlobalHandlers();
    window.dispatchEvent(new ErrorEvent('error', { message: 'script failed', error: new Error('script failed') }));
    const rej = new Event('unhandledrejection') as Event & { reason?: unknown };
    rej.reason = new Error('rejected');
    window.dispatchEvent(rej);
    expect(errorLog.entries().map((e) => e.message)).toEqual(['script failed', 'rejected']);
    expect(errorLog.entries().map((e) => e.where)).toEqual(['window', 'promise']);
  });
});
