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

## Not yet verified

- The Vercel steps of the workflow and the `vercel.json` headers on Vercel's infrastructure have not run (no Vercel account access from this machine). The ingest, validate, build and artifact steps ran successfully on GitHub on 2026-10-18 (first run, cold cache: 2 min 18 s total, GDELT download 72 s, snapshot build 21 s, validation passed, a 2.9 MB `events-snapshot` artifact; the three Vercel steps were skipped because no secrets exist). The Vercel steps themselves have never run.
- `deploymentEnabled` and the CLI flags are as documented by Vercel at the time of writing and were not run here.
- The security headers include no Content-Security-Policy yet; Plan 6 adds and tests it against the real app.
