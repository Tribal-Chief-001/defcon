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
  it('parses the War tracker links: #war for the list, #war=<id> for one conflict', () => {
    expect(parseHash('#war')).toEqual({ country: null, war: '' });
    expect(parseHash('#war=russia-ukraine')).toEqual({ country: null, war: 'russia-ukraine' });
    expect(parseHash('#war=xxx475-nigeria-2')).toEqual({ country: null, war: 'xxx475-nigeria-2' });
  });
  it.each([['#war='], ['#war=<script>'], ['#war=A'], ['#war=a_b'], ['#war=../x'], ['#war=' + 'a'.repeat(61)], ['#WAR'], ['#war=a&b=1']])('rejects %j as a war link', (h) => {
    expect(parseHash(h)).toEqual({ country: null });
  });
  it('formats war links, with about first, then war, then country', () => {
    expect(formatHash(null, false, '')).toBe('#war');
    expect(formatHash(null, false, 'russia-ukraine')).toBe('#war=russia-ukraine');
    expect(formatHash('IND', false, 'x')).toBe('#war=x');
    expect(formatHash('IND', true, 'x')).toBe('#about');
    expect(formatHash(null, false, '<x>')).toBe('#war'); // an invalid id falls back to the list
    expect(formatHash('IND', false, null)).toBe('#c=IND');
  });
});

describe('hash state: a moment (&t=<unix seconds>)', () => {
  it('parses the playhead after a country, a conflict, the about page and on its own', () => {
    expect(parseHash('#c=IND&t=1790000000')).toEqual({ country: 'IND', t: 1790000000 });
    expect(parseHash('#war=russia-ukraine&t=1790000000')).toEqual({ country: null, war: 'russia-ukraine', t: 1790000000 });
    expect(parseHash('#war&t=1790000000')).toEqual({ country: null, war: '', t: 1790000000 });
    expect(parseHash('#t=1790000000')).toEqual({ country: null, t: 1790000000 });
  });
  it.each([['#c=IND&t='], ['#c=IND&t=abc'], ['#c=IND&t=-5'], ['#c=IND&t=12'], ['#c=IND&t=1790000000&x=1'], ['#c=IND&t=1790000000&t=1790000001'], ['#t=<x>'], ['#c=IND&t=99999999999999'], ['#c=IND&t=1.5'], ['#war=a&&t=1790000000']])('rejects %j (the whole link is ignored)', (h) => {
    expect(parseHash(h)).toEqual({ country: null });
  });
  it('formats a moment after the link, or on its own, and drops a bad one', () => {
    expect(formatHash('IND', false, null, 1790000000)).toBe('#c=IND&t=1790000000');
    expect(formatHash(null, false, 'russia-ukraine', 1790000000.9)).toBe('#war=russia-ukraine&t=1790000000');
    expect(formatHash(null, false, null, 1790000000)).toBe('#t=1790000000');
    expect(formatHash('IND', false, null, Number.NaN)).toBe('#c=IND');
    expect(formatHash('IND', false, null, -3)).toBe('#c=IND');
    expect(formatHash(null, false, null, undefined)).toBe('');
  });
  it('round-trips', () => {
    expect(parseHash(formatHash('FJI', false, null, 1790000123))).toEqual({ country: 'FJI', t: 1790000123 });
  });
});

describe('hash state: odd characters', () => {
  it('never throws, also for line breaks and line separators inside the hash', () => {
    for (const h of ['#c=IND\n', '#c=IND\u2028&t=1790000000', '\n', '#war=a\r\n&t=1790000000']) expect(() => parseHash(h)).not.toThrow();
    expect(parseHash('#c=IND\n')).toEqual({ country: null });
  });
});
