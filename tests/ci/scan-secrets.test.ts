import { describe, expect, it } from 'vitest';
import { scanText } from '../../scripts/ci/scan-secrets';

// Samples are assembled at runtime so this file itself holds nothing that looks like a real key.
const j = (...p: string[]) => p.join('');
const rules = (text: string) => scanText('x.ts', text).map((h) => h.rule);

describe('scanText', () => {
  it('flags common secret shapes', () => {
    expect(rules(j('-----BEGIN ', 'RSA PRIVATE KEY-----'))).toContain('private-key');
    expect(rules(j('const k = "AKIA', 'ABCDEFGHIJKLMNOP"'))).toContain('aws-access-key');
    expect(rules(j('t = gh', 'p_', 'a'.repeat(36)))).toContain('github-token');
    expect(rules(j('t = github', '_pat_', 'A1b2'.repeat(10)))).toContain('github-token');
    expect(rules(j('s = "xox', 'b-123456789012-abcdefghij"'))).toContain('slack-token');
    expect(rules(j('k = "AI', 'za', 'Sy'.repeat(17), 'A"'))).toContain('google-api-key');
    expect(rules(j('Authorization: Bear', 'er ', 'a'.repeat(30)))).toContain('bearer-token');
    expect(rules(j('const api', 'Key = "', 'z9'.repeat(10), '"'))).toContain('assigned-secret');
    expect(rules(j('PASS', 'WORD: \'', 'hunter2hunter2hunter2', '\''))).toContain('assigned-secret');
  });
  it('flags more shapes: JSON keys, unquoted env assignments, npm and sk- keys', () => {
    expect(rules(j('{"api', '_key": "', 'z9'.repeat(10), '"}'))).toContain('assigned-secret');
    expect(rules(j('VERCEL_TO', 'KEN=', 'abcd1234'.repeat(3)))).toContain('env-assignment');
    expect(rules(j('npm', '_', 'A'.repeat(36)))).toContain('npm-token');
    expect(rules(j('key = sk', '-', 'a1'.repeat(15)))).toContain('sk-key');
    expect(rules('VERCEL_TOKEN=$VERCEL_TOKEN')).toEqual([]);
    expect(rules('# VITE_EVENTS_BASE=/data/events')).toEqual([]);
  });
  it('reports path, line and rule but never the matched text', () => {
    const secret = j('gh', 'p_', 'Q'.repeat(36));
    const hits = scanText('a/b.ts', `ok\nbad ${secret}\n`);
    expect(hits).toEqual([{ path: 'a/b.ts', line: 2, rule: 'github-token' }]);
    expect(JSON.stringify(hits)).not.toContain(secret);
  });
  it('does not flag ordinary code, short values, placeholders or compact data', () => {
    expect(scanText('a.ts', 'const token = getToken();\nconst password = "";\nconst apiKey = process.env.KEY;')).toEqual([]);
    expect(scanText('a.json', '{"lat":12.5,"name":"Aruba","iso3":"ABW","hash":"' + 'a'.repeat(64) + '"}')).toEqual([]);
    expect(scanText('w.yml', 'run: npx vercel deploy --token="$VERCEL_TOKEN"\n  TOKEN: "${{ secrets.X_TOKEN_VALUE }}"')).toEqual([]); // variable references are not secrets
    expect(scanText('a.md', 'Set VERCEL_TOKEN as a repository secret; never paste it in chat.')).toEqual([]);
  });
});
