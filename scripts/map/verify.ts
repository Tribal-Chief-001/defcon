import { createHash } from 'node:crypto';

export function verifySha256(bytes: Uint8Array, expectedHex: string): boolean {
  const actual = createHash('sha256').update(bytes).digest('hex');
  return actual === expectedHex.toLowerCase();
}
