import { describe, expect, it } from 'vitest';
import { formatHash, parseHash } from '../../src/lib/hashState';

describe('hash state (deep links)', () => {
  it.each([['#c=IND', 'IND'], ['#c=ind', 'IND'], ['#c=Fji', 'FJI']])('parses %s -> %s', (h, id) => {
    expect(parseHash(h)).toEqual({ country: id });
  });
  it.each([[''], ['#'], ['#c='], ['#x=1'], ['#c=<script>'], ['#c=INDIA'], ['#c=IN'], ['#c=IND&x=1'], ['c=IND'], ['#c=../x']])('returns null for %j', (h) => {
    expect(parseHash(h)).toEqual({ country: null });
  });
  it('formats a country id and nothing for null or an invalid id', () => {
    expect(formatHash('IND')).toBe('#c=IND');
    expect(formatHash(null)).toBe('');
    expect(formatHash('<x>')).toBe('');
    expect(formatHash('ind')).toBe('#c=IND');
  });
  it('round-trips', () => {
    for (const id of ['IND', 'USA', 'FJI']) expect(parseHash(formatHash(id)).country).toBe(id);
  });
  it('parses #about and keeps it apart from country links', () => {
    expect(parseHash('#about')).toEqual({ country: null, about: true });
    expect(parseHash('#ABOUT')).toEqual({ country: null });
    expect(parseHash('#about=1')).toEqual({ country: null });
    expect(parseHash('#c=IND')).toEqual({ country: 'IND' });
  });
  it('formats the about overlay ahead of a country link', () => {
    expect(formatHash(null, true)).toBe('#about');
    expect(formatHash('IND', true)).toBe('#about');
    expect(formatHash('IND', false)).toBe('#c=IND');
  });
});
