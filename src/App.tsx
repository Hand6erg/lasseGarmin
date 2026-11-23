import { useEffect, useState } from 'react';
import type { EncryptedBlob } from './lib/crypto';
import { decryptPlan, fetchBlob, readSavedPassword, savePassword, type PlanData } from './lib/plan';
import { Unlock } from './components/Unlock';
import { WeekView } from './views/WeekView';
import { CalendarView } from './views/CalendarView';
import { StrengthView } from './views/StrengthView';
import { MethodsView } from './views/MethodsView';
import { DataView } from './views/DataView';

type Tab = 'uge' | 'kalender' | 'data' | 'styrke' | 'metoder';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'uge', label: 'Uge', icon: '📋' },
  { id: 'kalender', label: 'Kalender', icon: '📅' },
  { id: 'data', label: 'Data', icon: '📈' },
  { id: 'styrke', label: 'Styrke', icon: '🏋️' },
  { id: 'metoder', label: 'Metoder', icon: '⚡' },
];

type State =
  | { kind: 'loading' }
  | { kind: 'missing' }
  | { kind: 'locked'; blob: EncryptedBlob }
  | { kind: 'ready'; plan: PlanData; password: string };

export default function App() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let blob: EncryptedBlob;
      try {
        blob = await fetchBlob('./data/plan.enc.json');
      } catch {
        if (!cancelled) setState({ kind: 'missing' });
        return;
      }
      const saved = readSavedPassword();
      if (saved) {
        try {
          const plan = await decryptPlan(blob, saved);
          if (!cancelled) setState({ kind: 'ready', plan, password: saved });
          return;
        } catch {
          savePassword(null); // the password was changed – ask again
        }
      }
      if (!cancelled) setState({ kind: 'locked', blob });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.kind === 'loading') return <p className="empty">Henter …</p>;
  if (state.kind === 'missing') return <p className="empty">Planen kunne ikke hentes. Prøv igen senere.</p>;
  if (state.kind === 'locked') {
    return (
      <Unlock
        title="Træningsplan"
        text="Siden er låst. Skriv koden én gang – telefonen husker den."
        onSubmit={async (pw) => {
          const plan = await decryptPlan(state.blob, pw);
          savePassword(pw);
          setState({ kind: 'ready', plan, password: pw });
        }}
      />
    );
  }
  return <Main plan={state.plan} password={state.password} />;
}

function Main({ plan, password }: { plan: PlanData; password: string }) {
  const [tab, setTab] = useState<Tab>('uge');
  const [strengthDay, setStrengthDay] = useState(plan.strength.days[0]?.id ?? '');
  const openStrength = (id: string) => {
    setStrengthDay(id);
    setTab('styrke');
    window.scrollTo(0, 0);
  };

  return (
    <div className="app">
      {tab === 'uge' && (
        <WeekView weeks={plan.weeks} strengthDays={plan.strength.days} today={new Date()} onOpenStrength={openStrength} />
      )}
      {tab === 'kalender' && (
        <CalendarView weeks={plan.weeks} strengthDays={plan.strength.days} today={new Date()} onOpenStrength={openStrength} />
      )}
      {tab === 'styrke' && <StrengthView program={plan.strength} selected={strengthDay} onSelect={setStrengthDay} />}
      {tab === 'metoder' && <MethodsView methods={plan.methods} />}
      {tab === 'data' && <DataView today={new Date()} password={password} />}

      <nav className="tabbar" aria-label="Faner">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? 'active' : ''}
            aria-current={tab === t.id ? 'page' : undefined}
            onClick={() => {
              setTab(t.id);
              window.scrollTo(0, 0);
            }}
          >
            <span aria-hidden>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
