// Serves dist/ with the header rules of vercel.json so the real built app can be checked in a browser (CSP violations, caching).
// Verification tool only; not used in production. Usage: npm run build && npm run serve:dist   (http://localhost:4173)
import { readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const ROOT = 'dist';
const PORT = Number(process.env.PORT ?? 4173);
const rules = (JSON.parse(readFileSync('vercel.json', 'utf8')) as { headers: { source: string; headers: { key: string; value: string }[] }[] }).headers.map((r) => ({
  re: new RegExp(`^${r.source}$`),
  headers: r.headers,
}));
const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.woff2': 'font/woff2',
  '.bin': 'application/octet-stream', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
};

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://x');
  const path = decodeURIComponent(url.pathname);
  let file = normalize(join(ROOT, path));
  if (!file.startsWith(ROOT)) return void res.writeHead(403).end();
  let ok = false;
  try {
    ok = statSync(file).isFile();
  } catch {
    /* not a file */
  }
  if (!ok) {
    if (path.startsWith('/data/') || path.startsWith('/assets/')) return void res.writeHead(404).end('not found');
    file = join(ROOT, 'index.html'); // single-page app fallback
  }
  const headers: Record<string, string> = { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' };
  for (const r of rules) if (r.re.test(path)) for (const h of r.headers) headers[h.key] = h.value;
  res.writeHead(200, headers).end(readFileSync(file));
}).listen(PORT, () => console.log(`serving ${ROOT}/ with vercel.json headers on http://localhost:${PORT}`));
