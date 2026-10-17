// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/globe/capabilities', () => ({ hasWebGL2: () => false }));
import { GlobeCanvas } from '../../src/globe/GlobeCanvas';

afterEach(cleanup);

describe('GlobeCanvas without WebGL2', () => {
  it('shows a clear message instead of a blank screen', () => {
    const { container } = render(<GlobeCanvas />);
    expect(screen.getAllByText(/WebGL2/i).length).toBeGreaterThan(0);
    expect(container.querySelector('canvas')).toBeNull();
  });
});
