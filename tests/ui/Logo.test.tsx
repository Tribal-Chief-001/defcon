// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Logo } from '../../src/ui/Logo';
import { TopBar } from '../../src/ui/TopBar';

afterEach(cleanup);

describe('Logo', () => {
  it('is a decorative inline SVG (the wordmark next to it carries the name)', () => {
    const { container } = render(<Logo />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('focusable')).toBe('false');
    expect(svg.querySelector('title')).toBeNull();
  });
  it('sits next to the DEFCON heading in the top bar', () => {
    render(<TopBar />);
    const h1 = screen.getByRole('heading', { level: 1, name: 'DEFCON' });
    expect(h1.parentElement!.querySelector('svg[aria-hidden="true"]')).toBeTruthy();
  });
});
