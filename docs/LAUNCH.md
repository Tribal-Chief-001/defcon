# Launch checklist (for the owner)

Everything below is either an owner decision, an account action the repo cannot take for you, or a check to repeat before the first public announcement. Tick them in order. Items marked **(owner)** need you; the rest are commands.

## 1. Owner reviews (the project cannot do these)

- [ ] **(owner)** Review the India guard-point list `data/map/india-guard.json` (18 points) against the Survey of India map, and `docs/MAP-POLICY.md`.
- [ ] **(owner)** Read the About page text (`src/ui/AboutPage.tsx`): map policy, "not the official DEFCON level", what the data does not cover, privacy.
- [ ] **(owner)** Review the provisional severity and tension scales (`docs/SEVERITY.md`, `docs/TENSION-INDEX.md`) and the alliance list and the active-dispute rule (D-042).
- [x] Licence: MIT for the code (the data keeps its own licences, see the README); the repo was made public on 2026-10-18 at the owner's request, after a history audit found no secrets (commit author email `raffrajput123@gmail.com` is visible in the history).
- [ ] **(owner)** Replace or confirm the Factbook-derived fields, which are archived (D-038); decide if that is acceptable for launch.

## 2. Hosting (owner accounts)

- [ ] **(owner)** Create or import the Vercel project (`docs/DEPLOY.md`, path A) and confirm the first build is green.
- [ ] **(owner)** Link the folder (`npx vercel link`), create a Vercel token, then store the three secrets with `gh secret set VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (values on stdin, never pasted anywhere else).
- [ ] Run `gh workflow run ingest.yml` and watch it (`gh run watch`): all steps green, the three Vercel steps now run, the site shows events.
- [ ] **(owner)** Decide on one deployer (Vercel Git integration or the workflow) as described in `docs/DEPLOY.md`.
- [ ] **(owner)** Domain and HTTPS in the Vercel dashboard; then `gh variable set SITE_URL --body "https://your-domain"` so `monitor.yml` can check freshness.
- [ ] Enable GitHub secret scanning and Dependabot alerts for the repository (settings; free for private repos on some plans).

## 3. Checks to repeat on the live site

- [ ] Open the site with the browser console open: no Content-Security-Policy violations; try `#about` and `#c=IND` as the first load.
- [ ] "Data as of" pill is LIVE or RECENT, the freshness monitor run is green, `recent.meta.json` is under 12 hours old.
- [ ] Response headers contain the CSP, HSTS, COOP and CORP (`curl -sI https://your-domain | less`).
- [ ] Keyboard only: Tab to the skip link, Enter, arrows and +/- on the globe, Ctrl/Cmd-K, Esc closes the top layer, About opens and closes.
- [ ] Phone: open on a real phone (the project could only test an emulated viewport): drag, pinch, dossier sheet, scrubber, About, no horizontal scroll, safe-area on a notched device.
- [ ] Reduced motion (OS setting): no grain shimmer, no sweeping pulse, Play disabled, Night Watch without sliding bars.
- [ ] Sound: off on load; the toggle needs a click; you hear pings during Play (the project could not listen).
- [ ] Frame rate on your laptop and on a phone with the dev overlay idea or the browser's performance panel; the quality tier steps down by itself if it is slow.

## 4. Known limits (what was not verified)

- Real phones and touch input, real screen readers, other GPUs and browsers (Safari, Firefox), audio output.
- The Vercel deployment path and the headers on Vercel itself (verified locally with `npm run serve:dist`).
- The monitor workflow (needs `SITE_URL`) and the Dependabot pull requests.
- Colour contrast over live globe imagery (only the design tokens are tested).

## 5. Operating it

- Data refresh is automatic (every 3 hours). A red `Ingest and publish` run means the validator stopped a bad snapshot; the site keeps the previous data. See "Reading a failed run" in `docs/DEPLOY.md`.
- UCDP revises its files: when `data:ucdp` fails on a hash mismatch, re-pin locally (`npm run data:ucdp -- --accept-new`), check `data/events/sources.json`, commit.
- Dossier data (World Bank, UN, NATO lists) is committed and refreshed by hand: `npm run data:wb`, `data:factbook`, `data:memberships`, `data:dossiers`, `data:relations`.
- Rotate the Vercel token if it was ever exposed (Vercel, Account Settings, Tokens; then `gh secret set VERCEL_TOKEN` again).
