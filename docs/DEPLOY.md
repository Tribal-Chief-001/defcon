# Deploying Defcon (runbook for the owner)

The app is a static Vite single-page app. `vercel.json` sets the framework, build command, output directory, security headers and cache rules. `npm run build` runs the type check and the production build; it does **not** need the generated event data.

Event data (`public/data/events/`, `data/raw/`) is generated and never committed. There are two ways to host the app.

## A. Simplest: import the repo in Vercel (no live data)

Done by the owner in the Vercel dashboard (nothing here creates accounts or tokens):

| Setting | Value |
|---------|-------|
| Framework preset | Vite (detected) |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Node.js version | 22.x (`.nvmrc`, `engines`) |
| Environment variables | none needed (`VITE_EVENTS_BASE` is optional, see `.env.example`) |

The site then shows the globe, borders, capitals, dossiers and relations, and "NO DATA" for events, because the event snapshot is not in git. To put events on a deployment by hand: `npm run data:ucdp && npm run data:gdelt -- --days 7 && npm run data:build && npm run data:validate`, then deploy that local build with the Vercel CLI.

## B. Live data: the scheduled workflow deploys the site

`.github/workflows/ingest.yml` ("Ingest and publish") runs **every 3 hours** (cron `17 */3 * * *`), after every push to `main`, and on demand. One run: restores caches, downloads UCDP (pinned by SHA-256) and the last 7 days of GDELT, builds the snapshot, **validates it** (`npm run data:validate`), builds the site, uploads the snapshot as a 3-day artifact, and then, only if the Vercel secrets exist, deploys with the Vercel CLI. `vercel build` runs repository code, so it gets no secret; only `pull` and `deploy` do. A failed validation stops the run before any deploy, so the live site keeps the previous data.

### One-time setup (owner)

1. Create or import the Vercel project (path A is fine) and link this folder once: `npx vercel link` (interactive). It writes `.vercel/project.json` (git-ignored); its `orgId` and `projectId` fields are the values for `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`.
2. In Vercel: Account Settings, Tokens, create a token. Treat it like a password.
3. Store three repository secrets with the GitHub CLI. Each command asks for the value on stdin; **never paste a token into a chat, an issue or a commit**.

```bash
gh secret set VERCEL_TOKEN
gh secret set VERCEL_ORG_ID
gh secret set VERCEL_PROJECT_ID
```

4. Run it once by hand and watch it:

```bash
gh workflow run ingest.yml
gh run watch
```

Without the secrets the workflow still ingests and validates (a useful check) but skips the three Vercel steps.

### Reading a failed run

- `Validate the snapshot (gate)` failed: the step prints the problems (missing file, hash mismatch, no recent events, data older than 48 h, bad coordinates, missing detail shard, overlapping windows). Nothing was deployed. Re-run once; if the source (UCDP or GDELT) is down, wait. Locally: `npm run data:validate`.
- `npm run data:ucdp` failed with a SHA-256 mismatch: UCDP revises its candidate files in place. Every run fails until the owner re-pins locally (`npm run data:ucdp -- --accept-new`), checks the diff of `data/events/sources.json` and commits it.
- A fetch step failed or GDELT is unreachable: the cache keeps older files, and the validator turns the run red once the newest data is older than 12 hours (the live site then keeps its previous data).
- The `events-snapshot` artifact on a run holds exactly what was validated.

### Cadence and cost

- Private repo: GitHub gives 2,000 free Actions minutes a month. Every 3 hours is about 240 runs of about 3 minutes, plus a run per push to `main`. Public repos have no minute limit, so the schedule could be tightened to `*/15` there.
- Vercel Hobby allows 100 deployments a day. Eight scheduled runs a day plus pushes fit; a 15-minute schedule (96 a day) would not leave room.
- The pill "data as of" tells the truth: live up to 4 h, recent up to 12 h, then stale.

### One deployer at a time

If Vercel's own Git integration is also connected, every push to `main` makes a data-less deployment that the next ingest run replaces (up to 3 hours later, or at once, because the workflow also runs on push to `main`). To make the workflow the only deployer, turn off Vercel's Git deployment for `main` in the Vercel project settings, or add `"git": { "deploymentEnabled": { "main": false } }` to `vercel.json` (check Vercel's current documentation for the exact key before relying on it). The trade-off: Vercel previews of pull requests stop unless you leave other branches enabled.

### Serving data from another origin

`VITE_EVENTS_BASE` (build-time) can point the app at `https://...` or another same-origin path; anything else is ignored. That origin must send CORS headers and cache like `/data/events/` in `vercel.json` (`max-age=0, must-revalidate`).

## Freshness monitor

`.github/workflows/monitor.yml` runs every 6 hours and fetches `recent.meta.json` from the live site; it fails (GitHub then emails you) when the file is missing or older than 12 hours. It only runs when the repository **variable** `SITE_URL` exists. After the first deploy: `gh variable set SITE_URL --body "https://your-domain"` (a variable, not a secret: it is a public address). Cost: about 4 short runs a day.

## Verification status

- **Verified (2026-10-18):** the ingest workflow ran green on GitHub including the three Vercel steps (run 39120790184: pull, build, deploy); the first run took 2 min 18 s with a cold cache (GDELT download 72 s, snapshot build 21 s, validation passed). The live site `https://defcon-roan.vercel.app` serves the events (8,918 events, as of 10:30 UTC) and every header from `vercel.json` (CSP, HSTS, COOP, CORP and the rest), checked with curl and in a browser with no CSP violations.
- **Not verified:** `git.deploymentEnabled` (documented by Vercel, not set or run here); the freshness monitor run (it needs a scheduled tick); a custom domain; behaviour on real phones, Safari/Firefox, screen readers and audio.

## Security headers

`vercel.json` sends, on every path: a Content-Security-Policy (`default-src 'self'`; scripts, styles, fonts, workers and connections only from the site itself; images only from the site; no inline styles or `style` attributes (React sets `style` props through the CSSOM, which CSP does not block, verified in the built app); no plugins, no framing, no `<base>`, no form posts; `upgrade-insecure-requests`), `Strict-Transport-Security` (2 years, without includeSubDomains), `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` and `Permissions-Policy`. The build never inlines assets as `data:` URIs (`vite.config.ts`), which is what keeps `font-src 'self'` strict. If you point `VITE_EVENTS_BASE` at another origin, add that origin to `connect-src` in `vercel.json` (and keep `tests/ci/csp.test.ts` in step). To check headers locally: `npm run build && npm run serve:dist` and open http://localhost:4173 with the browser console open.
