import { useMemo, useState } from 'react';
import type { StrengthDay, WeekPlan } from '../lib/types';
import { monthGrid, monthTitle, sessionsByDate, shortDay, toISODate } from '../lib/logic';
import { ICON, SessionCard } from './WeekView';

const WEEKDAYS = ['Ma', 'Ti', 'On', 'To', 'Fr', 'Lø', 'Sø'];

interface Props {
  weeks: WeekPlan[];
  strengthDays: StrengthDay[];
  today: Date;
  onOpenStrength: (id: string) => void;
}

export function CalendarView({ weeks, strengthDays, today, onOpenStrength }: Props) {
  const todayISO = toISODate(today);
  const [month, setMonth] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selected, setSelected] = useState(todayISO);
  const byDate = useMemo(() => sessionsByDate(weeks), [weeks]);
  const rows = monthGrid(month.year, month.month);

  const shift = (delta: number) => {
    const d = new Date(month.year, month.month + delta, 1);
    setMonth({ year: d.getFullYear(), month: d.getMonth() });
  };

  const daySessions = byDate.get(selected) ?? [];
  const sel = shortDay(selected);

  return (
    <div className="page">
      <div className="week-nav">
        <button className="btn-ghost" aria-label="Forrige måned" onClick={() => shift(-1)}>
          ‹
        </button>
        <div className="week-title">
          <h1 className="cap">{monthTitle(month.year, month.month)}</h1>
        </div>
        <button className="btn-ghost" aria-label="Næste måned" onClick={() => shift(1)}>
          ›
        </button>
      </div>

      <table className="calendar" aria-label="Kalender">
        <thead>
          <tr>
            <th className="cal-wk" scope="col">
              <span className="muted">Uge</span>
            </th>
            {WEEKDAYS.map((d) => (
              <th key={d} scope="col">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.days[0].date}>
              <th className="cal-wk muted" scope="row">
                {row.week}
              </th>
              {row.days.map((d) => {
                const sessions = byDate.get(d.date) ?? [];
                const active = sessions.filter((s) => s.type !== 'fri');
                const cls = [
                  'cal-day',
                  d.inMonth ? '' : 'out',
                  d.date === todayISO ? 'today' : '',
                  d.date === selected ? 'selected' : '',
                ]
                  .filter(Boolean)
                  .join(' ');
                return (
                  <td key={d.date}>
                    <button
                      className={cls}
                      aria-pressed={d.date === selected}
                      aria-label={`${d.day}. ${active.length ? active.map((s) => s.title).join(', ') : sessions.length ? 'Fridag' : 'Ingen plan'}`}
                      onClick={() => setSelected(d.date)}
                    >
                      <span className="cal-num">{d.day}</span>
                      <span className="cal-icons" aria-hidden>
                        {active.map((s) => ICON[s.type]).join('')}
                      </span>
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="section">
        <span className="cap">{sel.weekday}</span> {sel.date}
      </h2>
      {daySessions.length === 0 ? (
        <p className="empty">Ingen plan for denne dag.</p>
      ) : (
        <ul className="sessions" aria-label="Dagens sessioner" key={selected}>
          {daySessions.map((s) => (
            <SessionCard
              key={s.date + s.title}
              session={s}
              isToday={s.date === todayISO}
              defaultOpen
              strengthDay={strengthDays.find((d) => d.id === s.strengthDay)}
              onOpenStrength={onOpenStrength}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
