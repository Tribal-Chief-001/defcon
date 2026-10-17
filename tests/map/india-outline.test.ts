import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Topology } from 'topojson-specification';
import { indiaOutlineHash } from '../../scripts/map/pin-india';

describe('India outline pin', () => {
  it('matches the pinned SHA-256 (change only with an owner-approved ledger entry)', () => {
    const topo = JSON.parse(readFileSync('public/data/borders.high.topo.json', 'utf8')) as Topology;
    const pinned = readFileSync('data/map/india-outline.sha256', 'utf8').trim();
    expect(indiaOutlineHash(topo)).toBe(pinned);
  });
});
