// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { warLabelBus } from '../../src/globe/warLabelBus';
import { WarLabels } from '../../src/ui/war/WarLabels';

afterEach(() => {
  cleanup();
  warLabelBus.set([]);
});

describe('WarLabels', () => {
  it('draws the labels the globe publishes, decoratively, with the unit of the number', () => {
    const { container } = render(<WarLabels />);
    expect(container.textContent).toBe('');
    act(() => warLabelBus.set([{ id: 'a', name: 'Russia - Ukraine', x: 300, y: 200, r: 20, selected: false, rising: false, deaths90: 11167 }]));
    expect(container.textContent).toContain('Russia - Ukraine');
    expect(container.textContent).toContain('11,167 · 90 d');
    expect(container.firstElementChild!.getAttribute('aria-hidden')).toBe('true');
  });
  it('renders names as text, never as markup', () => {
    const { container } = render(<WarLabels />);
    act(() => warLabelBus.set([{ id: 'x', name: '<img src=x onerror=alert(1)>', x: 10, y: 200, r: 10, selected: true, rising: true, deaths90: 1 }]));
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('<img src=x');
  });
});
