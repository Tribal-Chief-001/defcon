// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConflictsFile } from '../../src/conflicts/types';
import { WarRoom } from '../../src/ui/WarRoom';
import { worldFixture } from '../conflicts/fixture';

const mocks = vi.hoisted(() => ({ downloadText: vi.fn(() => true) }));
vi.mock('../../src/exports/download', () => ({ downloadText: mocks.downloadText }));
vi.mock('../../src/dossier/load', () => ({ loadIndex: async () => [] }));
vi.mock('../../src/indices/load', async (orig) => ({ ...(await orig<typeof import('../../src/indices/load')>()), loadIndices: async () => null }));

const R = (best: number) => ({ best, low: best - 1, high: best + 1 });
const file: ConflictsFile = {
  generated: '2026-10-19',
  dataEnd: '2026-08-31',
  sources: ['t'],
  world: worldFixture(),
  conflicts: [{ id: 'a', name: 'Russia - Ukraine', kinds: ['state'], countries: [{ id: 'UKR', name: 'Ukraine', deaths365: 5 }], deaths: { d30: R(10), d90: R(30), d365: R(100) }, events: { d30: 1, d90: 2, d365: 3 }, trend: 'steady', lastDate: '2026-08-30', weekly: new Array(52).fill(1), latest: [], provisionalShare: 0, geo: null }],
};

beforeEach(() => {
  window.matchMedia = ((q: string) => ({ matches: /reduce/.test(q), media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => {
  cleanup();
  mocks.downloadText.mockClear();
});

describe('War room: CSV export of the conflicts', () => {
  it('downloads every listed conflict with the data end date in the file name', async () => {
    render(<WarRoom selected={null} onSelect={() => {}} onClose={() => {}} onDive={() => {}} onFocusPlace={() => {}} onHoverPin={() => {}} load={async () => file} loadTimeline={async () => null} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Download CSV: conflicts' }));
    expect(mocks.downloadText).toHaveBeenCalledTimes(1);
    const [name, text] = mocks.downloadText.mock.calls[0] as unknown as [string, string];
    expect(name).toBe('defcon-conflicts-2026-08-31.csv');
    expect(text).toContain('Russia - Ukraine');
    expect(text.split('\n')[0]).toMatch(/^id,name,kinds/);
  });
});
