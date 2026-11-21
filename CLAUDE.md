# Lasses træningsplan – rules for Claude

A read-only training overview for Lasse's phone. A scheduled Claude run updates the data once a week; GitHub Actions tests and publishes it to GitHub Pages. No server, no database, no login.

## Language
- Everything on GitHub (commits, branches, PRs, code comments) is in English.
- The site's UI and all plan content are in Danish.
- Summaries to the owner are in Danish.

## Structure
- React 19 + TypeScript + Vite, same setup as `Hand6erg/workout-tracker`. `base: './'` in `vite.config.ts` so it works on Pages.
- `src/data/weeks/<year>-W<week>.json` – one file per week (`WeekPlan` in `src/lib/types.ts`). Picked up automatically by `import.meta.glob`.
- `src/data/styrkeprogram.json` – the current strength program (`StrengthProgram`). Sessions link to it with `strengthDay` (`"mandag"` / `"onsdag"`).
- `src/data/metoder.json` – interval methods.
- `src/lib/logic.ts` – pure functions (week numbers, default week, validation). Tests in `src/lib/logic.test.ts` also validate every data file.
- `public/data/dashboard.enc.json` – encrypted Garmin data for the Data tab (charts). Copied as-is from `Hand6erg/LasseGarminPrivat/data/dashboard.enc.json` by the weekly run; decrypted in the browser (`src/lib/crypto.ts`) with the password Lasse types once. Never commit unencrypted Garmin data here.
- `src/lib/stats.ts` + `src/components/Charts.tsx` + `src/views/DataView.tsx` – the charts.
- `e2e/*.spec.ts` – Playwright, phone width.

## Planning
See `PLANNING.md` for the training rules the weekly run follows.

## Data rules
- Never delete old week files – they are Lasse's history.
- `start` is the Monday of the ISO week; every session `date` must fall in that week; one entry per day (Mon–Sun), rest days as `"type": "fri"`.
- `type` is one of `styrke`, `løb`, `svøm`, `cykel`, `fri`, `andet`.
- Keep `target` short (one line). Put step-by-step content in `details`.
- If the strength program changes, update `styrkeprogram.json` and its `updated` date.

## Workflow
1. Edit/add data (or code).
2. Run `npm run check` (typecheck + unit + build + e2e). If Playwright can't download Chromium: `PW_CHROMIUM_PATH=/opt/pw-browsers/chromium npm run check`.
3. Weekly data updates: commit directly to `main` (`Add plan for week <n>`) – CI publishes within a few minutes. Code changes: branch + PR into `main`.
4. Never push if `npm run check` is red.
