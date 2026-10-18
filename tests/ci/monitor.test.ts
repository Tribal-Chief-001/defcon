import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { runBodies, steps, workflowProblems } from './workflowRules';

const t = readFileSync('.github/workflows/monitor.yml', 'utf8');

describe('monitor.yml (data freshness monitor)', () => {
  it('follows every workflow rule', () => {
    expect(workflowProblems(t)).toEqual([]);
  });
  it('runs every 6 hours and by hand, never on pushes or pull requests', () => {
    expect(t).toMatch(/cron:\s*"\d+ \*\/6 \* \* \*"/);
    expect(t).toMatch(/workflow_dispatch:/);
    expect(t).not.toMatch(/^\s+(push|pull_request):/m);
  });
  it('only runs when the SITE_URL variable is set, passes it through env, and requires https', () => {
    expect(t).toMatch(/if:\s+\$\{\{\s*vars\.SITE_URL != ''\s*\}\}/);
    expect(t).toMatch(/SITE_URL:\s+\$\{\{\s*vars\.SITE_URL\s*\}\}/);
    const runs = steps(t).flatMap((s) => runBodies(s.text)).join('\n');
    expect(runs).not.toMatch(/\$\{\{/); // values reach the script only through env
    expect(t).toMatch(/https:\/\//);
    expect(t).toMatch(/recent\.meta\.json/);
    expect(t).toMatch(/--fail/);
    expect(t).toMatch(/--max-time/);
    expect(t).toMatch(/43200|12 \* 3600/); // fails when older than 12 hours
  });
});
