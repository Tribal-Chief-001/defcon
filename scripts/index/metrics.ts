// Small, dependency-free metrics and a ridge logistic regression (Newton / IRLS) for the Violence Risk Index study.
export function auc(scores: number[], labels: number[]): number {
  const idx = scores.map((_, i) => i).sort((a, b) => scores[a]! - scores[b]!);
  const rank = new Array<number>(scores.length);
  for (let i = 0; i < idx.length; ) {
    let j = i;
    while (j + 1 < idx.length && scores[idx[j + 1]!] === scores[idx[i]!]) j++;
    for (let k = i; k <= j; k++) rank[idx[k]!] = (i + j) / 2 + 1; // average rank of a tie group
    i = j + 1;
  }
  let pos = 0;
  let rankSum = 0;
  labels.forEach((y, i) => y === 1 && (pos++, (rankSum += rank[i]!)));
  const neg = labels.length - pos;
  return pos === 0 || neg === 0 ? NaN : (rankSum - (pos * (pos + 1)) / 2) / (pos * neg);
}

// Average precision; tied scores are processed as one block so ties cannot flatter the result.
export function averagePrecision(scores: number[], labels: number[]): number {
  const idx = scores.map((_, i) => i).sort((a, b) => scores[b]! - scores[a]!);
  const total = labels.reduce((s, y) => s + y, 0);
  if (total === 0) return NaN;
  let tp = 0;
  let seen = 0;
  let ap = 0;
  for (let i = 0; i < idx.length; ) {
    let j = i;
    while (j + 1 < idx.length && scores[idx[j + 1]!] === scores[idx[i]!]) j++;
    const blockPos = idx.slice(i, j + 1).reduce((s, k) => s + labels[k]!, 0);
    seen += j - i + 1;
    tp += blockPos;
    ap += (blockPos / total) * (tp / seen);
    i = j + 1;
  }
  return ap;
}

export const brier = (p: number[], y: number[]) => p.reduce((s, v, i) => s + (v - y[i]!) ** 2, 0) / p.length;
export const logLoss = (p: number[], y: number[]) => -p.reduce((s, v, i) => s + (y[i] === 1 ? Math.log(Math.max(v, 1e-9)) : Math.log(Math.max(1 - v, 1e-9))), 0) / p.length;

export type Logit = { mean: number[]; sd: number[]; w: number[] }; // w[0] = intercept
const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

export function fitLogistic(x: number[][], y: number[], ridge = 1e-3): Logit {
  const d = x[0]?.length ?? 0;
  const mean = Array.from({ length: d }, (_, j) => x.reduce((s, r) => s + r[j]!, 0) / x.length);
  const sd = Array.from({ length: d }, (_, j) => Math.sqrt(x.reduce((s, r) => s + (r[j]! - mean[j]!) ** 2, 0) / x.length) || 1);
  const z = x.map((r) => [1, ...r.map((v, j) => (v - mean[j]!) / sd[j]!)]);
  let w = new Array<number>(d + 1).fill(0);
  for (let it = 0; it < 50; it++) {
    const g = new Array<number>(d + 1).fill(0);
    const h = Array.from({ length: d + 1 }, () => new Array<number>(d + 1).fill(0));
    z.forEach((r, i) => {
      const p = sigmoid(r.reduce((s, v, j) => s + v * w[j]!, 0));
      for (let a = 0; a <= d; a++) {
        g[a]! += (p - y[i]!) * r[a]!;
        for (let b = 0; b <= d; b++) h[a]![b]! += p * (1 - p) * r[a]! * r[b]!;
      }
    });
    for (let a = 1; a <= d; a++) (g[a]! += ridge * w[a]!, (h[a]![a]! += ridge));
    const step = solve(h, g);
    w = w.map((v, a) => v - step[a]!);
    if (Math.max(...step.map(Math.abs)) < 1e-8) break;
  }
  return { mean, sd, w };
}

export const predictLogistic = (m: Logit, x: number[][]) => x.map((r) => sigmoid(m.w[0]! + r.reduce((s, v, j) => s + (m.w[j + 1]! * (v - m.mean[j]!)) / m.sd[j]!, 0)));

// Gaussian elimination with partial pivoting (the systems here are at most a handful of unknowns).
function solve(a: number[][], b: number[]): number[] {
  const n = b.length;
  const m = a.map((r, i) => [...r, b[i]!]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(m[r]![c]!) > Math.abs(m[p]![c]!)) p = r;
    [m[c], m[p]] = [m[p]!, m[c]!];
    const piv = m[c]![c]! || 1e-12;
    for (let r = c + 1; r < n; r++) {
      const f = m[r]![c]! / piv;
      for (let k = c; k <= n; k++) m[r]![k]! -= f * m[c]![k]!;
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let r = n - 1; r >= 0; r--) x[r] = (m[r]![n]! - m[r]!.slice(r + 1, n).reduce((s, v, k) => s + v * x[r + 1 + k]!, 0)) / (m[r]![r]! || 1e-12);
  return x;
}

// deterministic PRNG so bootstrap results are reproducible
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function percentile(xs: number[], p: number): number {
  if (xs.length === 0) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const pos = p * (s.length - 1);
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return s[lo]! + (s[hi]! - s[lo]!) * (pos - lo);
}

// Cluster bootstrap: resamples whole groups (countries) with replacement, because the months of one country are not independent.
// `stat` gets the row indices of one resample and returns a vector of statistics.
export function clusterBootstrap(groups: number[], reps: number, seed: number, stat: (idx: number[]) => number[]): number[][] {
  const byGroup = new Map<number, number[]>();
  groups.forEach((g, i) => (byGroup.get(g) ?? byGroup.set(g, []).get(g)!).push(i));
  const keys = [...byGroup.keys()];
  const rnd = mulberry32(seed);
  const out: number[][] = [];
  for (let r = 0; r < reps; r++) {
    const idx: number[] = [];
    for (let k = 0; k < keys.length; k++) idx.push(...byGroup.get(keys[Math.floor(rnd() * keys.length)]!)!);
    out.push(stat(idx));
  }
  return out;
}

