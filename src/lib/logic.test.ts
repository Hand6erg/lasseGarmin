import { describe, expect, it } from 'vitest';
import { formatEntry, makeEntry } from './log';
import { countActive, isoWeek, monthGrid, monthTitle, pickDefaultWeek, sessionsByDate, shortDay, weekRange } from './logic';
import type { WeekPlan } from './types';

const w = (year: number, week: number, start: string): WeekPlan => ({
  year,
  week,
  start,
  sessions: [{ date: start, type: 'løb', title: 'Løb' }],
});

describe('isoWeek', () => {
  it('finder rigtige ugenumre', () => {
    expect(isoWeek(new Date(2026, 8, 28))).toEqual({ year: 2026, week: 40 });
    expect(isoWeek(new Date(2026, 10, 21))).toEqual({ year: 2026, week: 47 });
    expect(isoWeek(new Date(2027, 0, 1))).toEqual({ year: 2026, week: 53 });
  });
});

describe('pickDefaultWeek', () => {
  const list = [w(2026, 39, '2026-09-21'), w(2026, 40, '2026-09-28'), w(2026, 42, '2026-10-12')];
  it('vælger den aktuelle uge', () => {
    expect(pickDefaultWeek(list, new Date(2026, 8, 30))).toEqual({ index: 1, status: 'nu' });
  });
  it('vælger næste kommende uge hvis den aktuelle mangler', () => {
    expect(pickDefaultWeek(list, new Date(2026, 9, 7))).toEqual({ index: 2, status: 'kommende' });
  });
  it('falder tilbage til den seneste uge', () => {
    expect(pickDefaultWeek(list, new Date(2026, 10, 21))).toEqual({ index: 2, status: 'gammel' });
  });
  it('håndterer ingen planer', () => {
    expect(pickDefaultWeek([], new Date()).status).toBe('ingen');
  });
});

describe('formattering', () => {
  it('viser dag og dato', () => {
    expect(shortDay('2026-09-28')).toEqual({ weekday: 'man', date: '28/9' });
    expect(weekRange('2026-09-28')).toBe('28. sep – 4. okt');
  });
  it('tæller kun aktive sessioner', () => {
    expect(countActive([...w(2026, 1, '2025-12-29').sessions, { date: '2025-12-30', type: 'fri', title: 'Fri' }])).toBe(1);
  });
});

describe('kalender', () => {
  it('bygger en månedsgrid fra mandag til søndag', () => {
    const rows = monthGrid(2026, 10); // november 2026
    expect(rows[0].days[0]).toEqual({ date: '2026-10-26', day: 26, inMonth: false });
    expect(rows[0].days[6]).toEqual({ date: '2026-11-01', day: 1, inMonth: true });
    expect(rows[0].week).toBe(44);
    expect(rows.at(-1)!.days[0].date).toBe('2026-11-30');
    expect(rows).toHaveLength(6);
    expect(rows.every((r) => r.days.length === 7)).toBe(true);
  });
  it('måned der starter på en mandag', () => {
    const rows = monthGrid(2027, 1); // februar 2027
    expect(rows[0].days[0].date).toBe('2027-02-01');
    expect(rows).toHaveLength(4);
  });
  it('månedens navn', () => {
    expect(monthTitle(2026, 10)).toBe('november 2026');
  });
  it('grupperer sessioner pr. dato', () => {
    const map = sessionsByDate([w(2026, 39, '2026-09-21'), w(2026, 40, '2026-09-28')]);
    expect(map.get('2026-09-28')?.[0].title).toBe('Løb');
    expect(map.has('2026-09-22')).toBe(false);
  });
});

describe('sidste kg/reps', () => {
  it('gemmer kun noget når der er skrevet noget', () => {
    expect(makeEntry(' ', '', '2026-11-24')).toBeNull();
    expect(makeEntry('132.5', ' 5 ', '2026-11-24')).toEqual({ kg: '132,5', reps: '5', date: '2026-11-24' });
    expect(makeEntry('', '10, 8, 7', '2026-11-24')).toEqual({ reps: '10, 8, 7', date: '2026-11-24' });
  });
  it('formaterer', () => {
    expect(formatEntry({ kg: '130', reps: '5', date: 'x' })).toBe('130 kg × 5');
    expect(formatEntry({ reps: '10, 8', date: 'x' })).toBe('kropsvægt × 10, 8');
    expect(formatEntry({ kg: '60', date: 'x' })).toBe('60 kg');
  });
});
