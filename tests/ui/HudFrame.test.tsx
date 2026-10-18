// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { HudFrame } from '../../src/ui/HudFrame';

afterEach(cleanup);

describe('HudFrame', () => {
  it('is purely decorative: aria-hidden, no pointer events, nothing focusable', () => {
    const { container } = render(<HudFrame />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute('aria-hidden')).toBe('true');
    expect(root.className).toContain('pointer-events-none');
    expect(root.querySelectorAll('a, button, input, [tabindex]').length).toBe(0);
  });
  it('draws four corner ticks and the outline DEFCON word, and hides on small screens', () => {
    const { container } = render(<HudFrame />);
    expect(container.querySelectorAll('[data-tick]').length).toBe(4);
    const word = container.querySelector('[data-word]') as HTMLElement;
    expect(word.textContent).toBe('DEFCON');
    expect((container.firstElementChild as HTMLElement).className).toMatch(/\bhidden\b.*\bsm:block\b/);
  });
  it('uses no shadow and a transparent fill for the word', () => {
    const { container } = render(<HudFrame />);
    const html = container.innerHTML;
    expect(html).not.toMatch(/shadow/);
    expect(html).toMatch(/text-transparent/);
  });
});
