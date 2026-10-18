// Rebuilds data/relations/memberships.json from the official UN and NATO pages (run by hand, a few times a year).
// Usage: npm run data:memberships
import { readFileSync, writeFileSync } from 'node:fs';
import { NATO_MEMBERS, natoPageCheck, parseUnMembers, parseUnObservers, resolveNames, type Memberships } from './memberships';

const UA = 'Mozilla/5.0 (compatible; Defcon/0.1; research showcase)'; // the UN site returns 403 to a bare client
const URLS = {
  un: 'https://www.un.org/en/about-us/member-states',
  obs: 'https://www.un.org/en/about-us/non-member-states',
  nato: 'https://www.nato.int/cps/en/natohq/nato_countries.htm',
};
const get = async (u: string) => {
  const r = await fetch(u, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`memberships: ${u}: HTTP ${r.status}`);
  return r.text();
};

const countries = JSON.parse(readFileSync('public/data/countries.json', 'utf8')) as { id: string; name: string; formalName: string | null }[];
const [un, obs, nato] = await Promise.all([get(URLS.un), get(URLS.obs), get(URLS.nato)]);
const members = resolveNames(parseUnMembers(un), countries);
const observers = resolveNames(parseUnObservers(obs), countries);
const natoCheck = natoPageCheck(nato, NATO_MEMBERS);
if (natoCheck.claimed !== NATO_MEMBERS.length || natoCheck.missing.length)
  throw new Error(`memberships: NATO page says ${natoCheck.claimed} members and lacks: ${natoCheck.missing.join(', ') || '(none)'}; the curated list has ${NATO_MEMBERS.length}`);
const natoIds = resolveNames([...NATO_MEMBERS], countries);
const unmapped = [...members.unmapped, ...observers.unmapped, ...natoIds.unmapped];
if (unmapped.length) throw new Error(`memberships: names not mapped to a country id: ${unmapped.join('; ')} (extend ALIASES in memberships.ts)`);
const asOf = new Date().toISOString().slice(0, 10);
const out: Memberships = {
  un: { members: [...new Set(members.ids)].sort(), observers: [...new Set(observers.ids)].sort(), source: URLS.un, observerSource: URLS.obs, asOf },
  nato: { members: [...new Set(natoIds.ids)].sort(), source: URLS.nato, asOf },
};
writeFileSync('data/relations/memberships.json', JSON.stringify(out, null, 2) + '\n');
console.log(`UN members ${out.un.members.length}, observers ${out.un.observers.join(',')}, NATO ${out.nato.members.length} (as of ${asOf})`);
