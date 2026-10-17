// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { installFrameOverlay } from '../../src/dev/frameOverlay';

afterEach(() => document.body.replaceChildren());

describe('installFrameOverlay', () => {
  it('is hidden until the backtick key is pressed, then toggles', () => {
    installFrameOverlay();
    const el = document.querySelector<HTMLElement>('[data-frame-overlay]')!;
    expect(el.style.display).toBe('none');
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '`' }));
    expect(el.style.display).toBe('block');
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '`' }));
    expect(el.style.display).toBe('none');
  });
  it('returns a tick function that fills the readout', () => {
    const tick = installFrameOverlay();
    for (let i = 0; i < 40; i++) tick(i * 16.667);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '`' }));
    tick(40 * 16.667 + 600); // forces a refresh of the text
    expect(document.querySelector('[data-frame-overlay]')!.textContent).toMatch(/fps/i);
  });
});
