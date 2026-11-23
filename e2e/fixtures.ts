import type { Page } from '@playwright/test';
import { webcrypto } from 'node:crypto';
import type { PlanData } from '../src/lib/plan';
import type { Dashboard } from '../src/lib/stats';

// Made-up test data. The real plan and Garmin data only exist encrypted in public/data,
// so the browser tests serve these instead, encrypted with a test password.
export const TEST_PASSWORD = 'test-kode';

const day = (date: string, type: string, title: string, extra: object = {}) => ({ date, type, title, ...extra });

export const plan: PlanData = {
  weeks: [
    {
      year: 2026,
      week: 39,
      start: '2026-09-21',
      label: 'Uge B',
      sessions: [
        day('2026-09-21', 'styrke', 'Styrke', { strengthDay: 'mandag' }),
        day('2026-09-22', 'svøm', 'Svøm'),
        day('2026-09-23', 'fri', 'Fri'),
        day('2026-09-24', 'løb', 'Tempoløb'),
        day('2026-09-25', 'fri', 'Fri'),
        day('2026-09-26', 'cykel', 'Cykel'),
        day('2026-09-27', 'løb', 'Long run'),
      ],
    },
    {
      year: 2026,
      week: 40,
      start: '2026-09-28',
      label: 'Uge A',
      sessions: [
        day('2026-09-28', 'styrke', 'Styrke — fuld krop', { strengthDay: 'mandag' }),
        day('2026-09-29', 'svøm', 'Svøm — teknik'),
        day('2026-09-30', 'cykel', 'Cykel — endurance', { target: '60 min Z2', details: ['Roligt'] }),
        day('2026-10-01', 'løb', 'Kvalitetsløb'),
        day('2026-10-02', 'fri', 'Fri'),
        day('2026-10-03', 'styrke', 'Styrke', { strengthDay: 'onsdag' }),
        day('2026-10-04', 'løb', 'Long run'),
      ],
    },
  ] as PlanData['weeks'],
  strength: {
    updated: '2026-01-01',
    days: [
      {
        id: 'mandag',
        title: 'Fuld krop (mandag)',
        exercises: [
          { name: 'Dødløft', sets: '3×5' },
          { name: 'Pull-up', sets: '4×max' },
        ],
        core: [{ name: 'Pallof press', sets: '3×12' }],
      },
      {
        id: 'onsdag',
        title: 'Fuld krop (onsdag)',
        exercises: [{ name: 'Back extension', sets: '3×10' }],
      },
    ],
    progression: ['Dødløft: 3×5 rent → +5 kg'],
  },
  methods: [{ name: 'Norsk 4×4', points: ['4 min hårdt / 3 min roligt × 4'] }],
};

function dashboard(): Dashboard {
  const activities: Dashboard['activities'] = [];
  const daily: Dashboard['daily'] = [];
  const end = new Date(2026, 10, 21);
  for (let i = 0; i < 84; i++) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    daily.push({ d: iso, rhr: 45 + (i % 4), hrv: 70 + (i % 9), sl: 7 + (i % 3) / 2, ss: 80 });
    if (d.getDay() === 0) activities.push({ d: iso, s: 'løb', km: 10 + (i % 3), min: 65, hr: 145 });
    if (d.getDay() === 6) activities.push({ d: iso, s: 'cykel', km: 40, min: 90, hr: 130 });
  }
  return { generated_at: '2026-11-21T18:00:00', activities, daily };
}

async function encrypt(payload: unknown, password: string) {
  const subtle = webcrypto.subtle;
  const salt = webcrypto.getRandomValues(new Uint8Array(16));
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const iter = 1000;
  const base = await subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  const key = await subtle.deriveKey({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
  const ct = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(payload))));
  const b64 = (b: Uint8Array) => Buffer.from(b).toString('base64');
  return { v: 1, kdf: 'PBKDF2-SHA256', iter, salt: b64(salt), iv: b64(iv), ct: b64(ct) };
}

/** Serve the test data instead of the real encrypted files. */
export async function serveTestData(page: Page) {
  const files = {
    'plan.enc.json': await encrypt(plan, TEST_PASSWORD),
    'dashboard.enc.json': await encrypt(dashboard(), TEST_PASSWORD),
  };
  for (const [name, body] of Object.entries(files)) {
    await page.route(`**/data/${name}`, (route) => route.fulfill({ json: body }));
  }
}

/** Open the site with test data and unlock it. */
export async function openUnlocked(page: Page) {
  await serveTestData(page);
  await page.goto('/');
  await page.getByLabel('Kode').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Lås op' }).click();
  await page.getByRole('navigation', { name: 'Faner' }).waitFor();
}
