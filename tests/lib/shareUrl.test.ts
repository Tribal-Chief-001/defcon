import { describe, expect, it } from 'vitest';
import { backFromMoment, shareUrl } from '../../src/lib/shareUrl';
import { MAX_BACK_S } from '../../src/time/store';

const NOW = 1_790_000_000;

describe('shareUrl', () => {
  const base = { origin: 'https://defcon-roan.vercel.app', pathname: '/', id: null, about: false, war: null, backS: 0, nowS: NOW };
  it('is the plain address when nothing is open and the playhead is live', () => {
    expect(shareUrl(base)).toBe('https://defcon-roan.vercel.app/');
  });
  it('links the open country or conflict', () => {
    expect(shareUrl({ ...base, id: 'ind' })).toBe('https://defcon-roan.vercel.app/#c=IND');
    expect(shareUrl({ ...base, war: 'russia-ukraine' })).toBe('https://defcon-roan.vercel.app/#war=russia-ukraine');
  });
  it('adds the moment of the playhead when time travel is on (absolute, so it means the same later), also on its own', () => {
    expect(shareUrl({ ...base, id: 'IND', backS: 3600 })).toBe(`https://defcon-roan.vercel.app/#c=IND&t=${NOW - 3600}`);
    expect(shareUrl({ ...base, backS: 86400 })).toBe(`https://defcon-roan.vercel.app/#t=${NOW - 86400}`);
  });
  it('ignores a bad playhead and keeps the path of a site served from a folder', () => {
    expect(shareUrl({ ...base, backS: Number.NaN })).toBe('https://defcon-roan.vercel.app/');
    expect(shareUrl({ ...base, origin: 'https://example.org', pathname: '/defcon/', id: 'FRA' })).toBe('https://example.org/defcon/#c=FRA');
  });
});

describe('backFromMoment', () => {
  it('is how far before now a moment lies, 0 for the present or the future, capped at the archive', () => {
    expect(backFromMoment(NOW - 7200, NOW)).toBe(7200);
    expect(backFromMoment(NOW, NOW)).toBe(0);
    expect(backFromMoment(NOW + 500, NOW)).toBe(0);
    expect(backFromMoment(NOW - 10 * MAX_BACK_S, NOW)).toBe(MAX_BACK_S);
    expect(backFromMoment(Number.NaN, NOW)).toBe(0);
  });
});
