// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SkipLink } from '../../src/ui/SkipLink';

afterEach(cleanup);

describe('SkipLink', () => {
  it('is a button that moves focus to the globe canvas', () => {
    render(<><SkipLink /><canvas id="globe-canvas" tabIndex={0} /></>);
    const b = screen.getByRole('button', { name: /skip to the globe/i });
    fireEvent.click(b);
    expect(document.activeElement).toBe(document.getElementById('globe-canvas'));
  });
  it('is the first focusable element and is visually hidden until focused', () => {
    const { container } = render(<><SkipLink /><button>other</button></>);
    expect(container.querySelector('button')!.textContent).toMatch(/skip/i);
    expect(container.querySelector('button')!.className).toMatch(/sr-only/);
    expect(container.querySelector('button')!.className).toMatch(/focus:not-sr-only/);
  });
});
