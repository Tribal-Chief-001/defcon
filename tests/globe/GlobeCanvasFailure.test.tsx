// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/globe/capabilities', () => ({ hasWebGL2: () => true }));
vi.mock('../../src/globe/engine', () => ({
  createGlobe: vi.fn(() => {
    throw new Error('GPU blocked');
  }),
}));
import { GlobeCanvas } from '../../src/globe/GlobeCanvas';

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// Review finding: WebGL2 can pass the probe and still fail (renderer throws, data 404): never a blank black page.
describe('GlobeCanvas startup failures', () => {
  it('shows a message when the renderer throws although WebGL2 was detected', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({}) })));
    const { container } = render(<GlobeCanvas />);
    expect(await screen.findByText(/failed to start/i)).toBeTruthy();
    expect(container.querySelector('canvas')).toBeNull();
  });
  it('shows a message when the data download fails (HTTP 404)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404, json: async () => ({}) })));
    render(<GlobeCanvas />);
    expect(await screen.findByText(/failed to start/i)).toBeTruthy();
  });
});
