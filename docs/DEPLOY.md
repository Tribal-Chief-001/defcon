# Deploying to Vercel

The app is a static Vite single-page app. `vercel.json` already sets the framework, build command, output directory and headers.

## Import settings (Vercel dashboard, done by the owner)

| Setting | Value |
|---------|-------|
| Framework preset | Vite (detected) |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Node.js version | 22.x (`.nvmrc`, `engines`) |
| Environment variables | none needed |

`npm run build` runs the type check and the production build; it does **not** need the generated event data.

## Event data

`public/data/events/` and `data/raw/` are generated and gitignored. A deploy straight from git has the globe, borders, capitals and country data, and shows "NO DATA" for events until the data pipeline (Plan 5: scheduled ingestion and publishing) is in place. Until then, to see events on a deployment, run `npm run data:ucdp && npm run data:gdelt && npm run data:build` locally and deploy the folder with the Vercel CLI, or wait for Plan 5.

## Not yet verified on Vercel itself

The header rules in `vercel.json` and the build on Vercel's infrastructure have not been run (no Vercel account access from this machine). The same steps are checked by CI on a clean Ubuntu runner (`.github/workflows/ci.yml`).
