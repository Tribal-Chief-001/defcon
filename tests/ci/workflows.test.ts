import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const DIR = '.github/workflows';
const files = readdirSync(DIR).filter((f) => f.endsWith('.yml'));
const text = (f: string) => readFileSync(`${DIR}/${f}`, 'utf8');

describe.each(files)('%s', (f) => {
  const t = text(f);
  it('pins every action to a full commit SHA with a version comment', () => {
    const uses = t.split('\n').filter((l) => /^\s*-?\s*uses:/.test(l));
    expect(uses.length).toBeGreaterThan(0);
    for (const l of uses) expect(l, l).toMatch(/uses:\s+[\w.-]+\/[\w./-]+@[0-9a-f]{40}\s+#\s+v\d/);
  });
  it('has top-level least-privilege permissions (contents: read only)', () => {
    const m = /^permissions:\n((?:[ \t]+.+\n)+)/m.exec(t);
    expect(m, 'top-level permissions block').not.toBeNull();
    expect(m![1]!.trim().split('\n').map((l) => l.trim())).toEqual(['contents: read']);
  });
  it('never uses pull_request_target and never interpolates untrusted event data into a shell line', () => {
    expect(t).not.toMatch(/pull_request_target/);
    for (const l of t.split('\n').filter((x) => /^\s*(-\s*)?run:/.test(x))) {
      expect(l).not.toMatch(/\$\{\{\s*(github\.head_ref|github\.event\.(pull_request|issue|comment|head_commit)|secrets\.)/);
    }
  });
  it('sets a job timeout', () => {
    expect(t).toMatch(/timeout-minutes:\s*\d+/);
  });
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
  it('validates the snapshot before it builds the site, uploads it or deploys', () => {
    const at = (s: string) => t.indexOf(s);
    expect(at('npm run data:validate')).toBeGreaterThan(at('npm run data:build'));
    expect(at('npm run data:validate')).toBeLessThan(at('npm run build'));
    expect(at('npm run data:validate')).toBeLessThan(at('upload-artifact'));
    expect(at('npm run data:validate')).toBeLessThan(at('deploy --prebuilt'));
  });
  it('reads secrets only in env blocks (job-level presence flag, step-level values), deploys only when the token exists', () => {
    for (const l of t.split('\n').filter((x) => x.includes('secrets.'))) expect(l, l).toMatch(/^\s+[A-Z_]+:\s+\$\{\{\s*secrets\.[A-Z_]+( != '')?\s*\}\}\s*$/);
    expect(t).toMatch(/HAS_VERCEL:\s+\$\{\{\s*secrets\.VERCEL_TOKEN != ''\s*\}\}/);
    const deploy = t.split('\n').filter((l) => /^\s+if:\s+env\.HAS_VERCEL == 'true'/.test(l));
    expect(deploy.length).toBeGreaterThanOrEqual(3); // pull, build, deploy
    expect(t).toMatch(/vercel@\d+\.\d+\.\d+/); // pinned CLI version
  });
  it('uploads the validated snapshot as an artifact with a short retention', () => {
    expect(t).toMatch(/path:\s*public\/data\/events/);
    expect(t).toMatch(/retention-days:\s*[1-7]\b/);
  });
});
