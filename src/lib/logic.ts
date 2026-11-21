import type { Session, WeekPlan } from './types';

/** Datoen som YYYY-MM-DD i lokal tid. */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** ISO-ugenummer (mandag = første dag). */
export function isoWeek(d: Date): { year: number; week: number } {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: t.getUTCFullYear(), week };
}

export function weekKey(p: { year: number; week: number }): number {
  return p.year * 100 + p.week;
}

export function sortWeeks(weeks: WeekPlan[]): WeekPlan[] {
  return [...weeks].sort((a, b) => weekKey(a) - weekKey(b));
}

/**
 * Hvilken uge skal vises som standard:
 * den aktuelle uge, ellers den næste kommende, ellers den seneste.
 */
export function pickDefaultWeek(weeks: WeekPlan[], today: Date): { index: number; status: 'nu' | 'kommende' | 'gammel' | 'ingen' } {
  const sorted = sortWeeks(weeks);
  if (sorted.length === 0) return { index: -1, status: 'ingen' };
  const now = weekKey(isoWeek(today));
  const exact = sorted.findIndex((w) => weekKey(w) === now);
  if (exact >= 0) return { index: exact, status: 'nu' };
  const next = sorted.findIndex((w) => weekKey(w) > now);
  if (next >= 0) return { index: next, status: 'kommende' };
  return { index: sorted.length - 1, status: 'gammel' };
}

const DAYS = ['søn', 'man', 'tir', 'ons', 'tor', 'fre', 'lør'];
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** "man 28/9" */
export function shortDay(iso: string): { weekday: string; date: string } {
  const d = parseDate(iso);
  return { weekday: DAYS[d.getDay()], date: `${d.getDate()}/${d.getMonth() + 1}` };
}

/** "28. sep – 4. okt" */
export function weekRange(start: string): string {
  const a = parseDate(start);
  const b = new Date(a);
  b.setDate(b.getDate() + 6);
  return `${a.getDate()}. ${MONTHS[a.getMonth()]} – ${b.getDate()}. ${MONTHS[b.getMonth()]}`;
}

export function countActive(sessions: Session[]): number {
  return sessions.filter((s) => s.type !== 'fri').length;
}

/** Simpel validering, så en forkert JSON-fil fra den planlagte opgave fanges af testene. */
export function validateWeek(w: WeekPlan): string[] {
  const errors: string[] = [];
  if (!w.year || !w.week) errors.push('year/week mangler');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(w.start)) errors.push('start skal være YYYY-MM-DD');
  else {
    const s = parseDate(w.start);
    if (s.getDay() !== 1) errors.push('start skal være en mandag');
    const iw = isoWeek(s);
    if (iw.week !== w.week || iw.year !== w.year) errors.push(`start ${w.start} passer ikke med uge ${w.week}/${w.year}`);
  }
  if (!Array.isArray(w.sessions) || w.sessions.length === 0) errors.push('sessions mangler');
  for (const s of w.sessions ?? []) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s.date)) errors.push(`dato "${s.date}" er ugyldig`);
    if (!s.title) errors.push(`session ${s.date} mangler titel`);
  }
  return errors;
}
