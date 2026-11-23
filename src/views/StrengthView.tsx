import { useState } from 'react';
import type { Exercise, StrengthProgram } from '../lib/types';
import { formatEntry, loadLog, makeEntry, saveLog, type SetLog } from '../lib/log';
import { shortDay, toISODate } from '../lib/logic';

interface Props {
  program: StrengthProgram;
  selected: string;
  onSelect: (id: string) => void;
}

export function StrengthView({ program, selected, onSelect }: Props) {
  const day = program.days.find((d) => d.id === selected) ?? program.days[0];
  const [y, m, d] = program.updated.split('-');
  const [log, setLog] = useState<SetLog>(loadLog);
  const save = (name: string, kg: string, reps: string) => {
    const entry = makeEntry(kg, reps, toISODate(new Date()));
    if (!entry) return;
    const next = { ...log, [name]: entry };
    setLog(next);
    saveLog(next);
  };

  return (
    <div className="page">
      <h1>Styrke</h1>
      <p className="muted">Opdateret {Number(d)}/{Number(m)}-{y}</p>

      <div className="segmented" role="tablist" aria-label="Styrkepas">
        {program.days.map((p) => (
          <button key={p.id} role="tab" aria-selected={p.id === day.id} onClick={() => onSelect(p.id)}>
            <span className="cap">{p.id}</span>
          </button>
        ))}
      </div>

      <h2 className="day-title">{day.title}</h2>
      {day.duration && <p className="muted">{day.duration}</p>}
      {day.intro && <p className="notice">{day.intro}</p>}
      {day.warmup && (
        <p>
          <strong>Opvarmning:</strong> {day.warmup}
        </p>
      )}

      <ExerciseList items={day.exercises} label="Øvelser" log={log} onSave={save} />
      {day.core && (
        <>
          <h3 className="section">Core (kan køres i træk)</h3>
          <ExerciseList items={day.core} label="Core" log={log} onSave={save} />
        </>
      )}

      <h3 className="section">Progression</h3>
      <ul className="bullets">
        {program.progression.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </div>
  );
}

interface ListProps {
  items: Exercise[];
  label: string;
  log: SetLog;
  onSave: (name: string, kg: string, reps: string) => void;
}

function ExerciseList({ items, label, log, onSave }: ListProps) {
  return (
    <ol className="exercises" aria-label={label}>
      {items.map((e) => (
        <ExerciseItem key={e.name} exercise={e} last={log[e.name]} onSave={onSave} />
      ))}
    </ol>
  );
}

function ExerciseItem({ exercise: e, last, onSave }: { exercise: Exercise; last?: SetLog[string]; onSave: ListProps['onSave'] }) {
  const [kg, setKg] = useState('');
  const [reps, setReps] = useState('');
  const [saved, setSaved] = useState(false);
  const id = e.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const day = last && shortDay(last.date);

  return (
    <li className="exercise">
      <div className="row-between">
        <strong>{e.name}</strong>
      </div>
      <div className="ex-meta">
        <span className="chip">{e.sets}</span>
        {e.rest && <span className="muted">Pause {e.rest}</span>}
      </div>
      {e.note && <div className="muted ex-note">{e.note}</div>}

      <div className="ex-last" aria-live="polite">
        {last && day ? (
          <>
            Sidst: <strong>{formatEntry(last)}</strong> <span className="muted">· {day.weekday} {day.date}</span>
            {saved && <span className="saved"> ✓ Gemt</span>}
          </>
        ) : (
          <span className="muted">Ikke logget endnu</span>
        )}
      </div>
      <form
        className="ex-log"
        aria-label={`Log ${e.name}`}
        onSubmit={(ev) => {
          ev.preventDefault();
          onSave(e.name, kg, reps);
          setKg('');
          setReps('');
          setSaved(true);
        }}
      >
        <label htmlFor={`kg-${id}`} className="visually-hidden">Kg</label>
        <input id={`kg-${id}`} inputMode="decimal" placeholder={last?.kg ? `${last.kg} kg` : 'kg'} value={kg} onChange={(ev) => setKg(ev.target.value)} />
        <label htmlFor={`reps-${id}`} className="visually-hidden">Reps</label>
        <input id={`reps-${id}`} inputMode="decimal" placeholder={last?.reps ? `${last.reps} reps` : 'reps'} value={reps} onChange={(ev) => setReps(ev.target.value)} />
        <button type="submit" className="btn-secondary small" disabled={!kg.trim() && !reps.trim()}>
          Gem
        </button>
      </form>
    </li>
  );
}
