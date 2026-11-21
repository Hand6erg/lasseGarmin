import { useEffect, useState } from 'react';
import { decryptBlob, type EncryptedBlob } from '../lib/crypto';
import { average, lastDays, shortDate, SPORTS, weeklyBuckets, type Dashboard, type Sport } from '../lib/stats';
import { ColumnChart, LineChart, StatTile, type Series } from '../components/Charts';

const STORAGE_KEY = 'lasse-plan-data-password';
const COLORS: Record<Sport, string> = {
  løb: 'var(--series-1)',
  cykel: 'var(--series-2)',
  svøm: 'var(--series-3)',
  styrke: 'var(--series-4)',
  andet: 'var(--series-other)',
};
const LABEL: Record<Sport, string> = { løb: 'Løb', cykel: 'Cykel', svøm: 'Svøm', styrke: 'Styrke', andet: 'Andet' };

type State =
  | { kind: 'loading' }
  | { kind: 'missing' }
  | { kind: 'locked'; blob: EncryptedBlob; error?: string }
  | { kind: 'ready'; data: Dashboard };

function readSaved(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function DataView({ today }: { today: Date }) {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('./data/dashboard.enc.json', { cache: 'no-cache' });
        if (!res.ok) throw new Error();
        const blob = (await res.json()) as EncryptedBlob;
        const saved = readSaved();
        if (saved) {
          try {
            const data = await decryptBlob<Dashboard>(blob, saved);
            if (!cancelled) setState({ kind: 'ready', data });
            return;
          } catch {
            /* password changed – ask again */
          }
        }
        if (!cancelled) setState({ kind: 'locked', blob });
      } catch {
        if (!cancelled) setState({ kind: 'missing' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.kind === 'loading') return <Page><p className="empty">Henter data …</p></Page>;
  if (state.kind === 'missing') return <Page><p className="empty">Der er ingen Garmin-data endnu.</p></Page>;
  if (state.kind === 'locked') return <Unlock blob={state.blob} error={state.error} onReady={(data) => setState({ kind: 'ready', data })} onError={(error) => setState({ ...state, error })} />;
  return <Charts data={state.data} today={today} />;
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="page">
      <h1>Data</h1>
      {children}
    </div>
  );
}

function Unlock({ blob, error, onReady, onError }: { blob: EncryptedBlob; error?: string; onReady: (d: Dashboard) => void; onError: (e: string) => void }) {
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <Page>
      <p className="muted">Garmin-dataene er krypteret. Skriv koden én gang – telefonen husker den.</p>
      <form
        className="unlock"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            const data = await decryptBlob<Dashboard>(blob, pw.trim());
            try {
              localStorage.setItem(STORAGE_KEY, pw.trim());
            } catch {
              /* private mode – just don't remember it */
            }
            onReady(data);
          } catch {
            onError('Forkert kode – prøv igen.');
          } finally {
            setBusy(false);
          }
        }}
      >
        <label htmlFor="pw">Kode</label>
        <input id="pw" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} />
        <button className="btn-primary" type="submit" disabled={!pw || busy}>
          {busy ? 'Låser op …' : 'Lås op'}
        </button>
        {error && <p className="error" role="alert">{error}</p>}
      </form>
    </Page>
  );
}

const h = (v: number) => {
  const hours = Math.floor(v);
  const min = Math.round((v - hours) * 60);
  return hours ? `${hours} t ${min} min` : `${min} min`;
};
const n1 = (v: number) => v.toFixed(1).replace('.', ',');

function Charts({ data, today }: { data: Dashboard; today: Date }) {
  const weeks = weeklyBuckets(data.activities, today, 12);
  const days = lastDays(data.daily, today, 28);
  const usedSports = SPORTS.filter((s) => weeks.some((w) => w.hours[s] > 0));
  const thisWeek = weeks[weeks.length - 1];
  const last7 = days.slice(-7);
  const prev7 = days.slice(-14, -7);
  const updated = new Date(data.generated_at);

  const volume: Series[] = usedSports.map((s) => ({ key: s, label: LABEL[s], color: COLORS[s], values: weeks.map((w) => w.hours[s] || undefined) }));
  const dayLabels = days.map((d) => shortDate(d.d));
  const lr = weeks.map((w) => w.longRun);

  const rhr7 = average(last7.map((d) => d.rhr));
  const rhrPrev = average(prev7.map((d) => d.rhr));
  const hrv7 = average(last7.map((d) => d.hrv));
  const sleep7 = average(last7.map((d) => d.sl));

  return (
    <div className="page data-page">
      <h1>Data</h1>
      <p className="muted">
        Fra Garmin · opdateret {updated.getDate()}/{updated.getMonth() + 1}
      </p>

      <div className="stats">
        <StatTile label="Denne uge" value={h(thisWeek.total)} sub={`${thisWeek.sessions} træninger · ${n1(thisWeek.km.løb)} km løb`} />
        <StatTile
          label="Hvilepuls (7 dage)"
          value={rhr7 ? `${Math.round(rhr7)}` : '–'}
          sub={rhr7 && rhrPrev ? `${rhr7 - rhrPrev >= 0 ? '+' : '−'}${n1(Math.abs(rhr7 - rhrPrev))} vs. ugen før` : 'slag/min'}
        />
        <StatTile label="HRV (7 nætter)" value={hrv7 ? `${Math.round(hrv7)} ms` : '–'} />
        <StatTile label="Søvn (7 nætter)" value={sleep7 ? h(sleep7) : '–'} sub="i gennemsnit" />
      </div>

      <ColumnChart
        title="Træningsmængde pr. uge"
        subtitle="Timer pr. sport, sidste 12 uger"
        labels={weeks.map((w) => w.label)}
        series={volume}
        unit="timer"
        tooltip={(i) => (
          <>
            <div className="tip-title">Uge {weeks[i].week}</div>
            <div className="tip-value">{h(weeks[i].total)}</div>
            {usedSports.filter((s) => weeks[i].hours[s] > 0).map((s) => (
              <div key={s} className="tip-row">
                <span className="key" style={{ background: COLORS[s] }} />
                <strong>{h(weeks[i].hours[s])}</strong> {LABEL[s].toLowerCase()}
                {weeks[i].km[s] > 0 && s !== 'styrke' ? ` · ${n1(weeks[i].km[s])} km` : ''}
              </div>
            ))}
          </>
        )}
      />

      <LineChart
        title="Long run"
        subtitle="Længste løbetur hver uge (km)"
        labels={weeks.map((w) => w.label)}
        series={{ key: 'lr', label: 'Long run', color: 'var(--series-1)', values: lr.map((l) => l?.km) }}
        unit="km"
        tooltip={(i) =>
          lr[i] ? (
            <>
              <div className="tip-title">Uge {weeks[i].week} · {shortDate(lr[i]!.d)}</div>
              <div className="tip-value">{n1(lr[i]!.km)} km</div>
              {lr[i]!.hr && <div className="tip-row">gns. puls <strong>{lr[i]!.hr}</strong></div>}
            </>
          ) : (
            <div className="tip-title">Uge {weeks[i].week}: intet løb</div>
          )
        }
      />

      <LineChart
        title="Hvilepuls"
        subtitle="Slag/min, sidste 28 dage – lavere er bedre restitution"
        labels={dayLabels}
        series={{ key: 'rhr', label: 'Hvilepuls', color: 'var(--series-1)', values: days.map((d) => d.rhr) }}
        unit="slag/min"
        zoom
        tooltip={(i) => (
          <>
            <div className="tip-title">{dayLabels[i]}</div>
            <div className="tip-value">{days[i].rhr ?? '–'} slag/min</div>
          </>
        )}
      />

      <LineChart
        title="HRV"
        subtitle="Nattens gennemsnit i ms, sidste 28 dage – højere er bedre"
        labels={dayLabels}
        series={{ key: 'hrv', label: 'HRV', color: 'var(--series-1)', values: days.map((d) => d.hrv) }}
        unit="ms"
        zoom
        tooltip={(i) => (
          <>
            <div className="tip-title">{dayLabels[i]}</div>
            <div className="tip-value">{days[i].hrv ?? '–'} ms</div>
          </>
        )}
      />

      <ColumnChart
        title="Søvn"
        subtitle="Timer pr. nat, sidste 28 dage"
        labels={dayLabels}
        series={[{ key: 'sl', label: 'Søvn', color: 'var(--series-1)', values: days.map((d) => d.sl) }]}
        unit="timer"
        tooltip={(i) => (
          <>
            <div className="tip-title">Natten til {dayLabels[i]}</div>
            <div className="tip-value">{days[i].sl ? h(days[i].sl!) : '–'}</div>
            {days[i].ss && <div className="tip-row">søvnscore <strong>{days[i].ss}</strong></div>}
          </>
        )}
      />
    </div>
  );
}
