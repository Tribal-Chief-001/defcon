import { describe, expect, it } from 'vitest';
import { verifySha256 } from '../../scripts/map/verify';

const ABC = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
const bytes = new TextEncoder().encode('abc');

describe('verifySha256', () => {
  it('accepts the matching hash', () => {
    expect(verifySha256(bytes, ABC)).toBe(true);
  });
  it('rejects a different hash', () => {
    expect(verifySha256(bytes, '0'.repeat(64))).toBe(false);
  });
  it('is case-insensitive on the expected hex', () => {
    expect(verifySha256(bytes, ABC.toUpperCase())).toBe(true);
  });
});
