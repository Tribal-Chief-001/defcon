// A small guard against committing credentials: scans tracked text files for common key shapes. It reports path:line:rule only and
// never prints the matched text, so a hit does not leak into CI logs. Not a replacement for GitHub secret scanning.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

type Hit = { path: string; line: number; rule: string };

const RULES: [string, RegExp][] = [
  ['private-key', /-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----/],
  ['aws-access-key', /\bAKIA[0-9A-Z]{16}\b/],
  ['github-token', /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{30,})/],
  ['slack-token', /\bxox[baprs]-[A-Za-z0-9-]{10,}/],
  ['google-api-key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['bearer-token', /\bBearer\s+[A-Za-z0-9._~+/=-]{20,}/],
  ['assigned-secret', /(?:secret|token|password|api[_-]?key)\s*[:=]\s*["'](?![$]|\{\{)[^"']{12,}["']/i],
];

export function scanText(path: string, text: string): Hit[] {
  const hits: Hit[] = [];
  text.split('\n').forEach((line, i) => {
    for (const [rule, re] of RULES) if (re.test(line)) hits.push({ path, line: i + 1, rule });
  });
  return hits;
}

const SKIP = /^(public\/data\/|data\/|tests\/fixtures\/|package-lock\.json$|\.superpowers\/)|\.(png|jpe?g|woff2?|ico|bin|zip|pdf)$/;

export function scanRepo(): Hit[] {
  const files = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split('\n').filter((f) => f && !SKIP.test(f));
  return files.flatMap((f) => {
    try {
      return scanText(f, readFileSync(f, 'utf8'));
    } catch {
      return [];
    }
  });
}

if (process.argv[1]?.endsWith('scan-secrets.ts')) {
  const hits = scanRepo();
  if (hits.length) {
    console.error(`possible secrets (matched text not shown):\n${hits.map((h) => `  ${h.path}:${h.line} ${h.rule}`).join('\n')}`);
    process.exit(1);
  }
  console.log('secret scan ok');
}
