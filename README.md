# Træningsplan 📅

Ugeplan, kalender, styrkeprogram, metoder og Garmin-grafer til telefonen. Hele indholdet er krypteret – siden viser kun en kodeboks, indtil man skriver koden. Telefonen husker koden bagefter.

**Læg den på hjemmeskærmen:** åbn siden i Safari → Del → "Føj til hjemmeskærm" (Android/Chrome: ⋮ → "Føj til startskærm").

## For udviklere
```bash
npm install
npm run dev     # lokal udvikling (kræver koden for at se indhold)
npm run check   # typecheck + tests + build + browsertests (bruger testdata, ikke de rigtige filer)
```

Dette repo indeholder kun app-koden og to krypterede filer i `public/data/`. Selve planen ligger i et privat repo og krypteres dér.
