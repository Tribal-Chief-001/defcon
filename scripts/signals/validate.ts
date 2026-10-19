import type { SignalsFile } from '../../src/signals/types';

const MAX = { seismic: 200, disasters: 100, fires: 800, fireTotals: 60 };
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

// Problems of a signals file (empty = valid). Missing data is fine (a source may be down); malformed or unsafe data is not.
export function validateSignals(f: SignalsFile, nowS: number): string[] {
  const out: string[] = [];
  const bad = (m: string) => out.push(m);
  if (!f || typeof f !== 'object') return ['not an object'];
  if (!Array.isArray(f.sources) || !Array.isArray(f.seismic) || !Array.isArray(f.disasters) || !Array.isArray(f.fires) || !Array.isArray(f.fireTotals)) return ['sources, seismic, disasters and fires must be lists'];
  for (const k of ['seismic', 'disasters', 'fires', 'fireTotals'] as const) if (f[k].length > MAX[k]) bad(`too many ${k} (${f[k].length} > ${MAX[k]})`);
  const ids = new Set<string>();
  for (const s of f.sources) {
    if (ids.has(s.id)) bad(`duplicate source ${s.id}`);
    ids.add(s.id);
    if (!s.licence?.trim()) bad(`${s.id}: licence is empty`);
    if (!s.attribution?.trim()) bad(`${s.id}: attribution is empty`);
    if (!/^https:\/\//.test(s.url ?? '')) bad(`${s.id}: url must be https`);
    if (s.licenceUrl !== undefined && !/^https:\/\//.test(s.licenceUrl)) bad(`${s.id}: licence url must be https`);
    const n = s.id === 'usgs' ? f.seismic.length : s.id === 'gdacs' ? f.disasters.length : s.id === 'firms' ? f.fires.length : -1;
    if (!s.ok && n > 0) bad(`${s.id}: marked failed but has data`);
    if (s.ok && s.count !== n) bad(`${s.id}: count ${s.count} does not match the data (${n})`);
  }
  const point = (at: string, p: { lat: number; lon: number }) => {
    if (!finite(p.lat) || Math.abs(p.lat) > 90) bad(`${at}: lat out of range`);
    if (!finite(p.lon) || Math.abs(p.lon) > 180) bad(`${at}: lon out of range`);
  };
  const when = (at: string, t: number) => {
    if (!finite(t) || t <= 0) bad(`${at}: time is not a number`);
    else if (t > nowS + 86400) bad(`${at}: time is in the future`);
  };
  const link = (at: string, u: string, host: RegExp) => {
    if (!/^https:\/\//.test(u ?? '')) bad(`${at}: link must be https`);
    else if (!host.test(u)) bad(`${at}: link is on an unexpected host`);
  };
  for (const s of f.seismic) (point(`seismic ${s.id}`, s), when(`seismic ${s.id}`, s.time), link(`seismic ${s.id}`, s.url, /^https:\/\/earthquake\.usgs\.gov\//));
  for (const d of f.disasters) (point(`disaster ${d.id}`, d), when(`disaster ${d.id}`, d.time), link(`disaster ${d.id}`, d.url, /^https:\/\/www\.gdacs\.org\//), ['Orange', 'Red'].includes(d.alert) || bad(`disaster ${d.id}: alert level`));
  for (const c of f.fires) (point('fire cell', c), when('fire cell', c.latestS), finite(c.count) && c.count > 0 || bad('fire cell: count'), typeof c.conflictId === 'string' && c.conflictId !== '' || bad('fire cell: conflictId'));
  for (const t of f.fireTotals) (point('fire total', t), finite(t.detections) && t.detections > 0 || bad('fire total: detections'), typeof t.conflictId === 'string' && t.conflictId !== '' || bad('fire total: conflictId'));
  return out;
}
