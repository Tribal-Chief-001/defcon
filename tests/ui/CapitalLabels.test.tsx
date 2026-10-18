// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CapitalLabels } from '../../src/ui/CapitalLabels';

afterEach(cleanup);
const L = (i: number, name = `City ${i}`) => ({ id: `C${i}`, name, x: 10 + i, y: 20 + i });

describe('CapitalLabels', () => {
  it('renders exactly the given labels, positioned, and is hidden from assistive tech', () => {
    const { container } = render(<CapitalLabels labels={[L(1), L(2)]} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute('aria-hidden')).toBe('true');
    const items = Array.from(root.querySelectorAll('span'));
    expect(items.map((s) => s.textContent)).toEqual(['City 1', 'City 2']);
    expect((items[0] as HTMLElement).style.transform).toBe('translate(20px, 15px)');
  });
  it('never renders more than the cap', () => {
    const { container } = render(<CapitalLabels labels={Array.from({ length: 60 }, (_, i) => L(i))} />);
    expect(container.querySelectorAll('span').length).toBe(40);
  });
  it('shows markup characters as text', () => {
    const { container } = render(<CapitalLabels labels={[L(1, '<img src=x onerror=alert(1)>')]} />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toBe('<img src=x onerror=alert(1)>');
  });
  it('renders nothing for an empty list', () => {
    const { container } = render(<CapitalLabels labels={[]} />);
    expect(container.querySelectorAll('span').length).toBe(0);
  });
});
