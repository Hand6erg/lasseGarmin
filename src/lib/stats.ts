import { isoWeek, weekKey } from './logic';

export type Sport = 'løb' | 'cykel' | 'svøm' | 'styrke' | 'andet';
export const SPORTS: Sport[] = ['løb', 'cykel', 'svøm', 'styrke', 'andet'];

export interface DashActivity {
  d: string;
  s: Sport;
  km?: number;
  min?: number;
  hr?: number;
  n?: string;
}
export interface DashDay {
  d: string;
  rhr?: number;
  hrv?: number;
  sl?: number;
  ss?: number;
}
export interface Dashboard {
  generated_at: string;
  activities: DashActivity[];
  daily: DashDay[];
}

function parse(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export interface WeekBucket {
  year: number;
  week: number;
  label: string;
  hours: Record<Sport, number>;
  km: Record<Sport, number>;
  sessions: number;
  total: number;
  longRun?: { d: string; km: number; hr?: number };
}

const zero = (): Record<Sport, number> => ({ løb: 0, cykel: 0, svøm: 0, styrke: 0, andet: 0 });

/** The last `count` ISO weeks up to and including the week of `today`, oldest first. Empty weeks included. */
export function weeklyBuckets(acts: DashActivity[], today: Date, count: number): WeekBucket[] {
  const buckets: WeekBucket[] = [];
  const index = new Map<number, WeekBucket>();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i * 7);
    const w = isoWeek(d);
    const b: WeekBucket = { ...w, label: `U${w.week}`, hours: zero(), km: zero(), sessions: 0, total: 0 };
    buckets.push(b);
    index.set(weekKey(w), b);
  }
  for (const a of acts) {
    const b = index.get(weekKey(isoWeek(parse(a.d))));
    if (!b) continue;
    const h = (a.min ?? 0) / 60;
    b.hours[a.s] += h;
    b.km[a.s] += a.km ?? 0;
    b.total += h;
    b.sessions += 1;
    if (a.s === 'løb' && a.km && (!b.longRun || a.km > b.longRun.km)) b.longRun = { d: a.d, km: a.km, hr: a.hr };
  }
  for (const b of buckets) {
    for (const s of SPORTS) {
      b.hours[s] = Math.round(b.hours[s] * 10) / 10;
      b.km[s] = Math.round(b.km[s] * 10) / 10;
    }
    b.total = Math.round(b.total * 10) / 10;
  }
  return buckets;
}

/** The last `days` days of daily metrics (oldest first), missing days included as gaps. */
export function lastDays(daily: DashDay[], today: Date, days: number): DashDay[] {
  const byDate = new Map(daily.map((d) => [d.d, d]));
  const out: DashDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    out.push(byDate.get(key) ?? { d: key });
  }
  return out;
}

export function average(values: (number | undefined)[]): number | undefined {
  const v = values.filter((x): x is number => typeof x === 'number');
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : undefined;
}

export function shortDate(iso: string): string {
  const d = parse(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}
