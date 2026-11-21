import { describe, expect, it } from 'vitest';
import { average, lastDays, weeklyBuckets, type DashActivity } from './stats';

const acts: DashActivity[] = [
  { d: '2026-11-15', s: 'løb', km: 10.1, min: 62, hr: 146 },
  { d: '2026-11-12', s: 'løb', km: 8.8, min: 52, hr: 163 },
  { d: '2026-11-14', s: 'cykel', km: 45.1, min: 90 },
  { d: '2026-11-18', s: 'styrke', min: 42 },
  { d: '2026-01-01', s: 'løb', km: 5, min: 30 },
];

describe('weeklyBuckets', () => {
  const weeks = weeklyBuckets(acts, new Date(2026, 10, 21), 3);
  it('makes one bucket per week, oldest first, including empty weeks', () => {
    expect(weeks.map((w) => w.week)).toEqual([45, 46, 47]);
    expect(weeks[0].total).toBe(0);
  });
  it('sums hours and km per sport and finds the long run', () => {
    expect(weeks[1].hours.løb).toBe(1.9);
    expect(weeks[1].hours.cykel).toBe(1.5);
    expect(weeks[1].km.løb).toBe(18.9);
    expect(weeks[1].sessions).toBe(3);
    expect(weeks[1].longRun).toEqual({ d: '2026-11-15', km: 10.1, hr: 146 });
    expect(weeks[2].hours.styrke).toBe(0.7);
  });
});

describe('lastDays', () => {
  it('fills missing days', () => {
    const d = lastDays([{ d: '2026-11-20', rhr: 48 }], new Date(2026, 10, 21), 3);
    expect(d).toEqual([{ d: '2026-11-19' }, { d: '2026-11-20', rhr: 48 }, { d: '2026-11-21' }]);
  });
});

describe('average', () => {
  it('ignores gaps', () => {
    expect(average([2, undefined, 4])).toBe(3);
    expect(average([undefined])).toBeUndefined();
  });
});
