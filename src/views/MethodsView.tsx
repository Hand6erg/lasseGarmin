import type { Method } from '../lib/types';

export function MethodsView({ methods }: { methods: Method[] }) {
  return (
    <div className="page">
      <h1>Metoder</h1>
      <p className="muted">Intervalformer til kvalitetsdagen.</p>
      <div className="stack">
        {methods.map((m) => (
          <section key={m.name} className="card">
            <h2>{m.name}</h2>
            <ul className="bullets">
              {m.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            {m.inPlan && (
              <p className="in-plan">
                <strong>I planen:</strong> {m.inPlan}
              </p>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
