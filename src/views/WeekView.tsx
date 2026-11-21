import { useState } from 'react';
import type { Session, StrengthDay, WeekPlan } from '../lib/types';
import { countActive, pickDefaultWeek, shortDay, toISODate, weekRange } from '../lib/logic';

const ICON: Record<Session['type'], string> = {
  styrke: '🏋️',
  løb: '🏃',
  svøm: '🏊',
  cykel: '🚴',
  fri: '😴',
  andet: '⭐',
};

interface Props {
  weeks: WeekPlan[];
  strengthDays: StrengthDay[];
  today: Date;
  onOpenStrength: (id: string) => void;
}

export function WeekView({ weeks, strengthDays, today, onOpenStrength }: Props) {
  const initial = pickDefaultWeek(weeks, today);
  const [index, setIndex] = useState(initial.index);
  const todayISO = toISODate(today);

  if (initial.status === 'ingen') {
    return (
      <div className="page">
        <h1>Ugeplan</h1>
        <p className="empty">Der er ingen planer endnu.</p>
      </div>
    );
  }

  const week = weeks[index];
  const isDefault = index === initial.index;

  return (
    <div className="page">
      <div className="week-nav">
        <button className="btn-ghost" aria-label="Forrige uge" disabled={index === 0} onClick={() => setIndex(index - 1)}>
          ‹
        </button>
        <div className="week-title">
          <h1>Uge {week.week}</h1>
          <div className="muted">{weekRange(week.start)}</div>
        </div>
        <button
          className="btn-ghost"
          aria-label="Næste uge"
          disabled={index === weeks.length - 1}
          onClick={() => setIndex(index + 1)}
        >
          ›
        </button>
      </div>

      {isDefault && initial.status === 'gammel' && (
        <p className="notice">Der er ikke kommet en plan for denne uge endnu. Her er den seneste.</p>
      )}
      {isDefault && initial.status === 'kommende' && <p className="notice">Planen for næste uge er klar.</p>}

      <div className="chips">
        {week.label && <span className="chip">{week.label}</span>}
        <span className="chip">{countActive(week.sessions)} sessioner</span>
      </div>
      {week.note && <p className="muted">{week.note}</p>}

      <ul className="sessions" aria-label="Sessioner">
        {week.sessions.map((s) => (
          <SessionCard
            key={s.date + s.title}
            session={s}
            isToday={s.date === todayISO}
            strengthDay={strengthDays.find((d) => d.id === s.strengthDay)}
            onOpenStrength={onOpenStrength}
          />
        ))}
      </ul>
    </div>
  );
}

function SessionCard({
  session,
  isToday,
  strengthDay,
  onOpenStrength,
}: {
  session: Session;
  isToday: boolean;
  strengthDay?: StrengthDay;
  onOpenStrength: (id: string) => void;
}) {
  const [open, setOpen] = useState(isToday);
  const day = shortDay(session.date);
  const expandable = !!session.details?.length || !!strengthDay;
  const rest = session.type === 'fri';

  return (
    <li className={`session${isToday ? ' today' : ''}${rest ? ' rest' : ''}`}>
      <button
        className="session-head"
        onClick={() => expandable && setOpen(!open)}
        aria-expanded={expandable ? open : undefined}
        disabled={!expandable}
      >
        <span className="session-day">
          <span className="cap">{day.weekday}</span>
          <span className="muted">{day.date}</span>
        </span>
        <span className="session-icon" aria-hidden>
          {ICON[session.type]}
        </span>
        <span className="session-text">
          <span className="session-title">
            {session.title}
            {isToday && <span className="today-badge">I dag</span>}
          </span>
          {session.target && <span className="muted">{session.target}</span>}
        </span>
        {expandable && <span className="chev" aria-hidden>{open ? '▾' : '▸'}</span>}
      </button>
      {open && expandable && (
        <div className="session-body">
          {session.details && (
            <ul className="bullets">
              {session.details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          )}
          {strengthDay && (
            <>
              <ol className="mini-ex">
                {strengthDay.exercises.map((e) => (
                  <li key={e.name}>
                    {e.name} <span className="muted">· {e.sets}</span>
                  </li>
                ))}
              </ol>
              <button className="btn-secondary small" onClick={() => onOpenStrength(strengthDay.id)}>
                Se hele styrkepasset
              </button>
            </>
          )}
        </div>
      )}
    </li>
  );
}
