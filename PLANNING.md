# How to plan Lasse's week

Used by the weekly scheduled run. Plans are written in Danish into `src/data/weeks/<year>-W<week>.json` (see CLAUDE.md for the format).

## Base structure (A/B rotation)
- **Even ISO weeks = Uge A**, **odd ISO weeks = Uge B** (week 39 was B, week 40 was A).
- **Uge A** – 6 sessions, only Friday off:
  Mon strength (`strengthDay: "mandag"`) · Tue swim technique · Wed bike endurance (Z2, HR <150) – or the optional Wednesday strength (`"onsdag"`) as a bonus · Thu quality run · Fri off · Sat strength (`"mandag"`) · Sun long run.
- **Uge B** – 5 sessions, Wednesday and Friday off:
  Mon strength (`"mandag"`) · Tue swim technique · Wed off · Thu quality run · Fri off · Sat bike endurance 60–75 min Z2 · Sun long run.

## Intensity rules
- Easy/endurance (bike, long run): Z1–Z2, **HR <150**.
- Long run: started at 9–11 km. Increase by at most ~1 km/week, and only if last week's long run stayed under HR 150. Every 4th week: drop back ~20 %.
- **Quality run (Thursday) is conditional on last Sunday's long run:**
  - Long run average HR <150 → real intervals (HR >175): alternate between **Norsk 4×4** and **30-20-10** (see `metoder.json`), each with ~10 min warm-up and cool-down jog.
  - Otherwise → controlled tempo: 10 min warm-up, 20–30 min at HR 165–172, 10 min cool-down.
- Swim: technique focus, drills + easy intervals, no pace pressure (e.g. 30–40 min, drills + 4×100 easy).

## Strength progression (`styrkeprogram.json`)
- Deadlift: all 3×5 clean → +5 kg. No max attempts.
- Overhead press: 4×8 done at 50 kg → 52.5 kg.
- Pull-up: +5 kg on the first 2 sets.
- Back extension: add a plate when 3×12 is easy.
Only change the numbers in `styrkeprogram.json` when Garmin/strength data actually shows the criterion was met; bump `updated`.

## Using Garmin data
Source: `data/latest.json` in the private repo `Hand6erg/LasseGarminPrivat` (fetched by a GitHub Action every Sunday ~17:30; check `generated_at` is from today/yesterday). Never copy raw Garmin data into this public repo – only the plan and a one-line `note`.
Look at the last 7–14 days: completed sessions vs. plan, long-run distance and average HR, interval HR, resting HR / HRV / sleep trend.
- Missed sessions or clearly worse HRV/sleep/resting HR → keep volume flat or reduce, choose tempo instead of intervals.
- Everything done and recovery stable → progress per the rules above.
- Put a one-line reason in the week's `note` (Danish), e.g. "Long run lå på HR 146 → rigtige intervaller torsdag."

Without Garmin data: follow the base structure, keep volumes the same as the latest plan, and say so in `note`.
