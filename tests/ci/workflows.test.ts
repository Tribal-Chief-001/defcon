import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const DIR = '.github/workflows';
const files = readdirSync(DIR).filter((f) => f.endsWith('.yml'));
const text = (f: string) => readFileSync(`${DIR}/${f}`, 'utf8');

import { runBodies, steps, workflowProblems } from './workflowRules';

// a plain (unquoted) YAML scalar must not contain ": " or " #": GitHub rejects the whole file ("workflow file issue") and the ingest never runs
describe.each(files)('%s: plain YAML scalars', (f) => {
  it('has no name, run or if value with an unquoted ": " or " #" inside', () => {
    const bad = text(f).split('\n').filter((l) => /^\s*(?:-\s+)?(name|if|uses):\s+[^"'|>\s]/.test(l)).filter((l) => /^\s*(?:-\s+)?(?:name|if|uses):\s+(.*)$/.exec(l)![1]!.match(/: | #(?!\s*v?\d)/) && !/^\s*(?:-\s+)?uses:/.test(l));
    expect(bad).toEqual([]);
  });
});

describe.each(files)('%s', (f) => {
  it('follows every workflow rule (pinned SHAs, least privilege, no injection, secrets only in step env, timeout)', () => {
    expect(workflowProblems(text(f))).toEqual([]);
  });
});

// the rules must actually catch what they claim to catch: break the real workflow and expect a named problem
describe('workflowProblems catches broken variants', () => {
  const base = text('ingest.yml');
  const has = (t: string, re: RegExp) => workflowProblems(t).some((x) => re.test(x));
  it('an unpinned action', () => expect(has(base.replace(/@3d3c42e[0-9a-f]+ # v7\.0\.1/, '@v7'), /not pinned/)).toBe(true));
  it('a job-level permissions override', () => expect(has(base.replace('    timeout-minutes: 25', '    timeout-minutes: 25\n    permissions: write-all'), /exactly once/)).toBe(true));
  it('injection inside a run block', () => expect(has(base.replace('      - run: npm ci', '      - run: |\n          echo ${{ github.head_ref }}'), /interpolated/)).toBe(true));
  it('a secret moved to the job-level env', () => expect(has(base.replace("      HAS_VERCEL:", "      VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}\n      HAS_VERCEL:"), /job-level env|outside a step env/)).toBe(true));
  it('continue-on-error', () => expect(has(base.replace('        run: npm run data:validate', '        run: npm run data:validate\n        continue-on-error: true'), /continue-on-error/)).toBe(true));
  it('pull_request_target', () => expect(has(base.replace('  workflow_dispatch:', '  workflow_dispatch:\n  pull_request_target:'), /pull_request_target/)).toBe(true));
});

describe('ingest.yml', () => {
  const t = text('ingest.yml');
  it('runs on a schedule of at most 8 times a day, on pushes to main and by hand, with a concurrency group', () => {
    const cron = /cron:\s*"([^"]+)"/.exec(t)![1]!;
    const [min, hour] = cron.split(' ');
    expect(min).toMatch(/^\d+$/);
    const perDay = hour === '*' ? 24 : hour!.startsWith('*/') ? Math.ceil(24 / Number(hour!.slice(2))) : hour!.split(',').length;
    expect(perDay).toBeLessThanOrEqual(8);
    expect(t).toMatch(/push:\s*\n\s+branches:\s*\[main\]/);
    expect(t).toMatch(/workflow_dispatch:/);
    expect(t).toMatch(/concurrency:\s*\n\s+group:\s*ingest\n\s+cancel-in-progress:\s*false/);
    expect(t).not.toMatch(/^\s+pull_request:/m);
  });
  it('validates the snapshot before it builds the site, uploads it or deploys, and the gate cannot be skipped', () => {
    const at = (x: string) => t.indexOf(x);
    expect(at('npm run data:validate')).toBeGreaterThan(at('npm run data:build'));
    expect(at('npm run data:validate')).toBeLessThan(at('npm run build'));
    expect(at('npm run data:validate')).toBeLessThan(at('upload-artifact'));
    expect(at('npm run data:validate')).toBeLessThan(at('deploy --prebuilt'));
    const gate = steps(t).find((s) => /data:validate/.test(s.text))!;
    expect(gate.text).not.toMatch(/\bif:|continue-on-error|\|\|/);
  });
  it('deploys only when the token exists: every step that runs vercel carries the guard, and only pull and deploy see secrets', () => {
    expect(t).toMatch(/HAS_VERCEL:\s+\$\{\{\s*secrets\.VERCEL_TOKEN != ''\s*\}\}/);
    const vercel = steps(t).filter((s) => runBodies(s.text).some((b) => /vercel@/.test(b)));
    expect(vercel.length).toBe(3);
    for (const s of vercel) expect(s.text).toMatch(/^\s+if:\s+env\.HAS_VERCEL == 'true'/m);
    for (const s of vercel) expect(runBodies(s.text).join('\n')).toMatch(/vercel@\d+\.\d+\.\d+/);
    const build = vercel.find((s) => /vercel@[\d.]+ build/.test(runBodies(s.text).join('\n')))!;
    expect(build.text, 'the build step runs repository code and must not see any secret').not.toMatch(/secrets\./);
  });
  it('uploads the validated snapshot as an artifact with a short retention', () => {
    expect(t).toMatch(/path:\s*public\/data\/events/);
    expect(t).toMatch(/retention-days:\s*[1-7]\b/);
  });
});

describe('data-updates.yml (the monthly alert for newer UCDP data and an old timeline)', () => {
  const t = text('data-updates.yml');
  it('runs monthly and by hand, only reads the repository, and has no secrets, pushes or write permissions', () => {
    expect(t).toMatch(/cron:\s*"\d+ \d+ \d+ \* \*"/); // once a month
    expect(t).toMatch(/workflow_dispatch:/);
    expect(t).toMatch(/permissions:\s*\n\s+contents: read/);
    expect(t).not.toMatch(/secrets\./);
    expect(t).not.toMatch(/git push|contents: write|pull-requests: write/);
  });
  it('runs the UCDP check and the timeline age check', () => {
    expect(t).toMatch(/npm run data:ucdp-discover -- --check/);
    expect(t).toMatch(/npm run data:timeline-age/);
  });
});

describe('ingest.yml: the signals step', () => {
  const t = text('ingest.yml');
  it('builds the signals before the site is built, and never uses continue-on-error (a down source is handled inside the script)', () => {
    const i = t.indexOf('npm run data:signals');
    expect(i).toBeGreaterThan(0);
    expect(i).toBeLessThan(t.indexOf('- run: npm run build'));
    expect(t.slice(i - 400, i + 200)).not.toMatch(/continue-on-error|\|\|\s*true|if:\s*always\(\)/);
  });
});
