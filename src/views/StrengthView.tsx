import type { Exercise, StrengthProgram } from '../lib/types';

interface Props {
  program: StrengthProgram;
  selected: string;
  onSelect: (id: string) => void;
}

export function StrengthView({ program, selected, onSelect }: Props) {
  const day = program.days.find((d) => d.id === selected) ?? program.days[0];
  const [y, m, d] = program.updated.split('-');

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

      <ExerciseList items={day.exercises} label="Øvelser" />
      {day.core && (
        <>
          <h3 className="section">Core (kan køres i træk)</h3>
          <ExerciseList items={day.core} label="Core" />
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

function ExerciseList({ items, label }: { items: Exercise[]; label: string }) {
  return (
    <ol className="exercises" aria-label={label}>
      {items.map((e) => (
        <li key={e.name} className="exercise">
          <div className="row-between">
            <strong>{e.name}</strong>
          </div>
          <div className="ex-meta">
            <span className="chip">{e.sets}</span>
            {e.rest && <span className="muted">Pause {e.rest}</span>}
          </div>
          {e.note && <div className="muted ex-note">{e.note}</div>}
        </li>
      ))}
    </ol>
  );
}
