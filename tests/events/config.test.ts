import { describe, expect, it } from 'vitest';
import { eventsBase } from '../../src/events/config';

const DEFAULT = '/data/events';
describe('eventsBase', () => {
  it('defaults when unset or empty', () => {
    expect(eventsBase(undefined)).toBe(DEFAULT);
    expect(eventsBase('')).toBe(DEFAULT);
  });
  it('keeps a same-origin absolute path and an https URL, without a trailing slash', () => {
    expect(eventsBase('/data/events/')).toBe('/data/events');
    expect(eventsBase('/x/y')).toBe('/x/y');
    expect(eventsBase('https://cdn.example.com/defcon/events')).toBe('https://cdn.example.com/defcon/events');
    expect(eventsBase('https://cdn.example.com/events/')).toBe('https://cdn.example.com/events');
  });
  it.each([
    'http://cdn.example.com/events',
    'javascript:alert(1)',
    '//evil.example.com/events',
    'data:text/plain,hi',
    'events',
    '../events',
    ' /data/events',
    '/data/events\n',
    'https://exa mple.com/x',
    'https://',
    'ftp://x/y',
    '/data/../../etc',
    '/\\evil.example.com/x',
    '/\\\\evil.example.com/x',
    'https://user:pw@host.example.com/x',
    'https://host.example.com/x?',
    'https://host.example.com/x#',
  ])('rejects %j and falls back to the default', (raw) => {
    expect(eventsBase(raw)).toBe(DEFAULT);
  });
});
