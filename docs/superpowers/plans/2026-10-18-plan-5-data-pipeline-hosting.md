# Data Pipeline and Hosting Implementation Plan (Plan 5)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (Native: one session does every task, one fresh Sonnet reviewer at the end) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the event snapshot fresh without a backend: a scheduled GitHub Actions job ingests, validates and (when the owner has set three secrets) deploys the site to Vercel with the new data; CI is hardened; the deployment is fully documented and the parts that can be verified are verified.

**Architecture:** The app stays a static Vite SPA. The data build (`data:ucdp`, `data:gdelt`, `data:build`) is unchanged; Plan 5 adds a validator that must pass before anything is published, a configurable events base URL, one scheduled workflow (`ingest.yml`) and hardening of `ci.yml`. Publishing = `vercel build` + `vercel deploy --prebuilt --prod` from the workflow, guarded by secrets; without the secrets the workflow still ingests, validates and uploads the snapshot as an artifact. No account, token or paid resource is created by this plan.

**Tech Stack:** GitHub Actions, Node 22, tsx, Vitest, Vercel CLI (run only in the workflow), existing scripts under `scripts/events/`.

**Spec:** `docs/superpowers/specs/2026-10-18-defcon-design.md` (section 9 delivery, section 10 constraints). Decisions D-013 (no always-on backend), D-035 (private repo, Vercel deployed by the owner).

## Global Constraints

- Never create accounts, tokens or paid resources; never print or store a secret; secrets are only read from `secrets.*` inside workflows. Anything that needs the owner (Vercel project, token) is documented with exact commands, not done.
- Private-repo Actions minutes are limited (2,000 free minutes a month): the schedule is every 3 hours (about 240 runs of about 3 minutes a month) and is one constant that the docs explain how to change; a public repo allows 15 minutes. Vercel Hobby allows 100 deployments a day: 8 a day by schedule plus pushes.
- Workflows: top-level `permissions: contents: read`; third-party actions pinned to a full commit SHA with the version in a comment; `concurrency` set; `timeout-minutes` set; no `pull_request_target`; no untrusted input in `run:` lines.
- Event data stays out of git (`public/data/events/`, `data/raw/` are ignored); `npm run build` must still work without it.
- Honest data: a failed or empty ingest must never publish a broken or empty snapshot over a good one; the "data as of" pill keeps telling the truth about age.
- Keep the initial JS under 250 KB gzip (225 KB now). Machine rule: one vitest/vite/build process at a time.
- Say plainly what was NOT verified: the Vercel deploy path cannot run here (no account); the workflow itself can be run once on GitHub with `gh workflow run` (a bounded cost, recorded).

## Review Focus

1. A bad ingest (zero events, a failed GDELT fetch, corrupt or truncated snapshot, a stale `asOf`, a hash mismatch) must fail the workflow before deploy and leave the live site on the previous data. [Tasks 1, 3]
2. Workflow security: a pull request from a fork cannot reach secrets or deploy; no script injection through branch names or inputs; pinned actions; least-privilege permissions. [Tasks 3, 4]
3. The site with and without data and with a custom events base: wrong or hostile `VITE_EVENTS_BASE` values (http, javascript:, protocol-relative) are rejected; the app still loads with "NO DATA". [Task 2]
4. Cadence honesty: the freshness pill thresholds match a 3-hour publish cadence (live is not shown for data a few hours old). [Task 2]
5. Secret hygiene: nothing secret in the repo or workflow logs; the scanner catches the common key shapes without flagging the committed data files. [Task 4]

---

### Task 1: Snapshot validator

**Files:**
- Create: `scripts/events/validate-snapshot.ts`, `tests/events/validate-snapshot.test.ts`
- Modify: `package.json` (script `data:validate`), `docs/DATA-SOURCES.md`

**Interfaces:**
- Consumes: `decodeSnapshot`, `verifySnapshotHash`, `SnapshotMeta` from `src/events/snapshot.ts`.
- Produces `validateSnapshotDir(dir: string, nowS: number, opts?: { maxAgeS?: number; minRecent?: number }): Promise<{ ok: boolean; problems: string[] }>`; defaults `maxAgeS = 48 * 3600`, `minRecent = 1`. Checks, each a named problem string: `recent.bin`, `recent.meta.json`, `archive.bin`, `archive.meta.json` exist; meta `n` equals the decoded count; the sha256 in the meta matches the bytes; `recent.n >= minRecent`; `asOfS` not older than `maxAgeS` and not in the future by more than 1 h; all lat/lon finite and in range; every `detailIdx` points into a shard file that exists under `detail/<name>/<day>.json` for the event's day; recent and archive windows do not overlap. CLI (`npm run data:validate`): exits 1 and prints the problems.

- [ ] **Step 1: Write failing tests** with `encodeSnapshot` + `writeSnapshots` into a temp dir: a good pair passes; a missing `recent.bin`, a flipped byte (hash mismatch), `n = 0`, an `asOfS` 3 days old, an `asOfS` 2 hours in the future, a NaN latitude, a missing shard, and overlapping windows each fail with their own problem text; two problems are both reported.
- [ ] **Step 2: Run** `npx vitest run tests/events/validate-snapshot.test.ts` -> FAIL. **Step 3: Implement.** **Step 4: Run** the file, then `npm run data:validate` against the real local `public/data/events` (record whether it passes; the local data is old, so expect the freshness problem and say so). **Step 5: Commit** `feat(events): add a snapshot validator that gates publishing`.

### Task 2: Configurable events base and cadence-honest freshness

**Files:**
- Create: `src/events/config.ts`, `tests/events/config.test.ts`
- Modify: `src/App.tsx` (use the config), `src/events/freshness.ts`, `tests/events/freshness.test.ts`, `src/vite-env.d.ts`, `.env.example`, `docs/DEPLOY.md`

**Interfaces:**
- Produces `eventsBase(raw: string | undefined): string`: `undefined`/empty -> `/data/events`; a same-origin absolute path (`/x/y`) is kept without a trailing slash; an `https://` URL is kept; anything else (`http://`, `javascript:`, `//host`, `data:`, relative, whitespace, control characters) returns `/data/events` and never throws. `App.tsx` uses `eventsBase(import.meta.env.VITE_EVENTS_BASE)`.
- `freshness()` thresholds change to the publish cadence: `live` up to 4 h, `recent` up to 12 h, otherwise `stale` (constants `LIVE_S`, `RECENT_S` exported with a comment tying them to the 3-hour schedule); label unchanged.

- [ ] **Step 1: Write failing tests:** `eventsBase` for each accepted and rejected shape above; freshness: age 3 h 59 min is live, 4 h 1 min recent, 12 h 1 min stale, a future time live, NaN stale. Existing freshness tests that assumed 45 min / 3 h are updated to the new constants (the change is the point; record it in the commit).
- [ ] **Step 2: Run** -> FAIL. **Step 3: Implement.** **Step 4: Run** the suite, typecheck, build -> PASS. **Step 5: Commit** `feat(events): make the events base configurable and match freshness to the publish cadence`.

### Task 3: Ingest workflow

**Files:**
- Create: `.github/workflows/ingest.yml`, `tests/ci/workflows.test.ts`
- Modify: `package.json` (script `ci:ingest` running fetch, build and validate in order), `docs/DEPLOY.md`

**Interfaces:** the workflow is `name: Ingest and publish`, `on: schedule: cron "17 */3 * * *"`, `push` to `main`, `workflow_dispatch`. One job, `timeout-minutes: 25`, `concurrency: { group: ingest, cancel-in-progress: false }`, `permissions: contents: read`. Steps in order: checkout (pinned), setup-node from `.nvmrc` with npm cache (pinned), `npm ci`, restore `data/raw` with `actions/cache` keyed `raw-${{ hashFiles('data/events/sources.json') }}` (UCDP files are pinned by hash; GDELT files cached with a rolling `restore-keys` prefix), `npm run data:ucdp`, `npm run data:gdelt -- --days 7`, `npm run data:build`, `npm run data:validate` (the gate), `npm run build`, upload `public/data/events` as an artifact (retention 3 days), then a deploy step that only runs `if: ${{ env.VERCEL_TOKEN != '' }}` where the env comes from `secrets.VERCEL_TOKEN`, `secrets.VERCEL_ORG_ID`, `secrets.VERCEL_PROJECT_ID` (the secret values only appear in the `env:` of that step; the `if` checks the token's presence via an earlier step output, never echoing it), running `npx vercel pull --yes --environment=production`, `npx vercel build --prod`, `npx vercel deploy --prebuilt --prod` with a pinned CLI version. The deploy step does not run on `pull_request` (the workflow has no such trigger).

- [ ] **Step 1: Write failing tests** (`tests/ci/workflows.test.ts` reads the YAML as text; no new dependency): every `uses:` is `owner/name@<40 hex>` followed by a `# vX` comment; `permissions:` appears at top level with only `contents: read`; no `pull_request_target`; `schedule` present with a cron of at most 8 runs a day (parse the hour field); `concurrency` and `timeout-minutes` present; the deploy step references secrets only in an `env:` block and no `run:` line contains `${{ secrets` or `${{ github.event`/`github.head_ref`; the validate step comes before the build and deploy steps; `data:validate` is a named step.
- [ ] **Step 2: Run** -> FAIL. **Step 3: Write the workflow** (look up action SHAs with `gh api repos/<owner>/<name>/git/ref/tags/<tag>`; for annotated tags dereference to the commit). **Step 4: Run** the tests and `npm run typecheck` -> PASS; run the ingest locally (`npm run data:gdelt -- --days 1 && npm run data:build && npm run data:validate`) and record the result. **Step 5: Commit** `feat(ci): add the scheduled ingest workflow that validates before it publishes`.

### Task 4: CI hardening and secret scan

**Files:**
- Modify: `.github/workflows/ci.yml`; Create: `.github/dependabot.yml`, `scripts/ci/scan-secrets.ts`, `tests/ci/scan-secrets.test.ts`; Modify: `package.json` (`ci:scan`), `tests/ci/workflows.test.ts`

**Interfaces:**
- `scanText(path: string, text: string): { path: string; line: number; rule: string }[]` (rules: PEM private key blocks, AWS access key ids `AKIA[0-9A-Z]{16}`, GitHub tokens `gh[pousr]_[A-Za-z0-9]{36,}` and `github_pat_`, Slack `xox[baprs]-`, Google API keys `AIza[0-9A-Za-z_-]{35}`, `Bearer ` followed by 20+ token characters, and `(secret|token|password|api[_-]?key)\s*[:=]\s*["'][^"']{12,}["']`; never returns the matched text). `scanRepo(files: string[]): ...` runs over `git ls-files`, skipping `public/data/`, `data/`, lockfiles and `tests/fixtures/`; CLI exits 1 on a hit and prints path:line:rule only.
- `ci.yml`: top-level `permissions: contents: read`, pinned actions, Node 24 runtime action versions, `timeout-minutes`, new steps `npm run ci:scan` and `npm audit --omit=dev --audit-level=high`. `dependabot.yml`: weekly updates for `npm` and `github-actions`.

- [ ] **Step 1: Write failing tests:** each rule fires on a synthetic sample built at runtime in the test (string concatenation, so the test file itself holds no real-looking key); no result contains the secret text; `public/data/` style JSON and a normal source file produce none; the workflow tests from Task 3 are extended to cover `ci.yml`.
- [ ] **Step 2: Run** -> FAIL. **Step 3: Implement** the scanner and update `ci.yml` and `dependabot.yml`; run `npm run ci:scan` on the repo (record the result; fix real findings, never print them) and `npm audit --omit=dev` (record; a high finding is fixed or ledgered). **Step 4: Run** the suite -> PASS. **Step 5: Commit** `feat(ci): pin actions, least-privilege permissions, secret scan, audit and dependabot`.

### Task 5: Deployment documentation and configuration tests

**Files:**
- Modify: `docs/DEPLOY.md`, `vercel.json` (only if a test finds a defect), `README.md`; Create: `tests/ci/vercel-config.test.ts`

**Interfaces:** `docs/DEPLOY.md` is rewritten as the owner's runbook: (A) simplest path, import the repo in Vercel (settings table), no live data until a manual `vercel deploy` of a local build; (B) live-data path: create the Vercel project (once), then set three secrets with exact `gh secret set` commands (values come from the owner's Vercel dashboard; never pasted into chat), enable `ingest.yml`, what the first run does, how to run it by hand, how to read a failed validation, how to change the cadence, cost notes (Actions minutes, deployment limit), and how to turn Vercel's own Git deployment off for `main` (`vercel.json` `git.deploymentEnabled`) when the workflow is the only deployer, with the trade-off stated. A "Not yet verified" section lists what has not run on Vercel.

- [ ] **Step 1: Write failing tests** (`vercel-config.test.ts`): `vercel.json` parses; every header `source` is a valid regular expression as Vercel reads it (convert `/(.*)` style with a simple check that parentheses balance and no `{` appears); the security headers are present for `/(.*)`; immutable cache only under `/assets/`; `/data/events/` has `must-revalidate`; no header value contains a newline; `DEPLOY.md` mentions each secret name `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` and the words "never paste".
- [ ] **Step 2: Run** -> FAIL (docs). **Step 3: Write the docs.** **Step 4: Run** -> PASS. **Step 5: Commit** `docs(deploy): write the Vercel runbook and test the hosting configuration`.

### Task 6: Verify on GitHub and close out

**Files:** Modify `docs/DECISIONS.md`, `docs/ROADMAP.md`, `docs/BACKLOG.md`, `README.md`, `docs/DATA-SOURCES.md`.

- [ ] **Step 1: Run** the full suite twice, typecheck, build, `check:budgets`, `ci:scan`. **Step 2: After the merge to main and push** (the merge is part of finishing this plan), run `gh workflow run ingest.yml` once and watch it with `gh run watch`; record the result, the duration, any failure and its fix, and the artifact size; confirm CI is green on `main`. If the ingest fails because of a source outage, record that and re-run once, not repeatedly. **Step 3: Docs:** DECISIONS (cadence and cost reasoning, publishing design, validator gate, secrets stance), ROADMAP, BACKLOG (what is deferred: 15-minute cadence on a public repo, Vercel Blob or R2 for decoupled data, the Vercel path unverified), README. **Step 4: Commit** `docs(plan-5): close out the data pipeline and hosting`.

---

## Self-review

- **Spec coverage (section 9):** scheduled ingestion (3); snapshot to the CDN (workflow deploy, 3, 5); client re-checks (already built, base configurable in 2); honest age display (2); Vercel flow documented (5). **Not in this plan:** a 15-minute cadence (cost), a separate data origin, any Vercel resource creation (owner), monitoring/alerting (Plan 6).
- **Types:** `validateSnapshotDir`, `eventsBase`, `scanText` are defined once and used with these names; workflow step names are fixed in Task 3 and asserted in the tests.
- **Not verified (to check during the work):** that `actions/*` tags dereference to commit SHAs as expected; that the GDELT fetch fits the runner time with the cache; Vercel CLI behaviour (cannot run); the cost of the first run.
