# Træningsplan – rules for Claude

A read-only training overview for the owner's phone, published on GitHub Pages. **This repo is public, so it must never contain personal data in plain text** – no plan content, notes, health numbers, goals, dates from someone's life, names or passwords. Everything personal lives in the private repo `Hand6erg/LasseGarminPrivat` and reaches this repo only as two encrypted files.

## Language
- Everything on GitHub (commits, branches, PRs, code comments) is in English.
- The site's UI is in Danish. Summaries to the owner are in Danish.

## Structure
- React 19 + TypeScript + Vite. `base: './'` in `vite.config.ts` so it works on Pages.
- `public/data/plan.enc.json` – the whole plan (weeks, strength program, methods) as `PlanData` (`src/lib/plan.ts`), encrypted.
- `public/data/dashboard.enc.json` – Garmin data for the Data tab, encrypted.
- Both are built by the private repo (`scripts/build_site.py` / its "Build site data" Action) and copied here byte-for-byte. Never decrypt them into this repo and never commit their password.
- The app asks for the password once (`src/components/Unlock.tsx`), remembers it in `localStorage`, and decrypts in the browser (`src/lib/crypto.ts`).
- `src/lib/logic.ts` – pure functions (week numbers, default week, calendar grid). Tests in `src/lib/logic.test.ts`.
- `e2e/*.spec.ts` – Playwright, phone width. They use made-up test data from `e2e/fixtures.ts` (encrypted with a test password at test time), never the real files.

## Updating the plan
1. Edit `plan/` in the private repo (rules in its `PLANNING.md`), push.
2. Wait for its "Build site data" Action to commit fresh `data/plan.enc.json` + `data/dashboard.enc.json`.
3. Copy those two files to `public/data/` here, run `npm run check` (`PW_CHROMIUM_PATH=/opt/pw-browsers/chromium npm run check` if Playwright can't download Chromium), commit to `main` ("Update encrypted plan data") and push. CI publishes within a few minutes.

## Code changes
Branch + PR into `main`. Never push if `npm run check` is red.
