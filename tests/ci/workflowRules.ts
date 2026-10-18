// Rules every workflow in this repo must follow, as a function so the tests can also prove that broken variants are caught.
type Step = { header: string; text: string };

export function steps(text: string): Step[] {
  const lines = text.split('\n');
  const out: Step[] = [];
  let cur: string[] | null = null;
  for (const l of lines) {
    if (/^ {6}- /.test(l)) {
      if (cur) out.push({ header: cur[0]!, text: cur.join('\n') });
      cur = [l];
    } else if (cur) {
      if (/^\S/.test(l) || /^ {0,4}\S/.test(l)) {
        out.push({ header: cur[0]!, text: cur.join('\n') });
        cur = null;
      } else cur.push(l);
    }
  }
  if (cur) out.push({ header: cur[0]!, text: cur.join('\n') });
  return out;
}

// the text of every `run:` (single line or block scalar)
export function runBodies(stepText: string): string[] {
  const lines = stepText.split('\n');
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = /^(\s*)(?:- )?run:\s*(.*)$/.exec(lines[i]!);
    if (!m) continue;
    if (/^[|>][+-]?$/.test(m[2]!)) {
      const body: string[] = [];
      for (let j = i + 1; j < lines.length && (lines[j]!.trim() === '' || lines[j]!.length - lines[j]!.trimStart().length > m[1]!.length); j++) body.push(lines[j]!);
      out.push(body.join('\n'));
    } else out.push(m[2]!);
  }
  return out;
}

export function workflowProblems(text: string): string[] {
  const p: string[] = [];
  for (const l of text.split('\n').filter((x) => /^\s*-?\s*uses:/.test(x)))
    if (!/uses:\s+[\w.-]+\/[\w./-]+@[0-9a-f]{40}\s+#\s+v\d/.test(l)) p.push(`action not pinned to a SHA with a version comment: ${l.trim()}`);
  const perms = text.split('\n').filter((l) => /^\s*permissions:/.test(l));
  if (perms.length !== 1 || !/^permissions:/m.test(text)) p.push('permissions must appear exactly once, at the top level');
  const top = /^permissions:\n((?:[ \t]+.+\n)+)/m.exec(text);
  if (!top || top[1]!.trim().split('\n').map((l) => l.trim()).join('|') !== 'contents: read') p.push('top-level permissions must be exactly contents: read');
  if (/pull_request_target/.test(text)) p.push('pull_request_target is not allowed');
  if (!/timeout-minutes:\s*\d+/.test(text)) p.push('missing timeout-minutes');
  if (/continue-on-error:\s*true/.test(text)) p.push('continue-on-error: true is not allowed');
  const all = steps(text);
  for (const s of all) {
    for (const body of runBodies(s.text)) {
      if (/\$\{\{\s*(github\.head_ref|github\.event\.|secrets\.|inputs\.)/.test(body)) p.push(`untrusted or secret value interpolated into a run script: ${s.header.trim()}`);
    }
    const secretLines = s.text.split('\n').filter((l) => l.includes('secrets.'));
    for (const l of secretLines) if (!/^ {10}[A-Z_]+:\s+\$\{\{\s*secrets\.[A-Z_]+\s*\}\}\s*$/.test(l)) p.push(`secret outside a step env block: ${l.trim()}`);
  }
  for (const l of text.split('\n').filter((x) => x.includes('secrets.'))) {
    if (/^ {6}[A-Z_]+:/.test(l) && !/!= ''/.test(l)) p.push(`secret value in a job-level env: ${l.trim()}`); // only the presence flag may be job-level
    if (/^ {4}[A-Z_]+:/.test(l)) p.push(`secret in a top-level or job key: ${l.trim()}`);
  }
  return p;
}
