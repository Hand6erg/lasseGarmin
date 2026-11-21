import { useState } from 'react';
import { strengthProgram, trainingMethods, weeks } from './lib/data';
import { WeekView } from './views/WeekView';
import { StrengthView } from './views/StrengthView';
import { MethodsView } from './views/MethodsView';
import { DataView } from './views/DataView';
import { CalendarView } from './views/CalendarView';

type Tab = 'uge' | 'kalender' | 'data' | 'styrke' | 'metoder';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'uge', label: 'Uge', icon: '📋' },
  { id: 'kalender', label: 'Kalender', icon: '📅' },
  { id: 'data', label: 'Data', icon: '📈' },
  { id: 'styrke', label: 'Styrke', icon: '🏋️' },
  { id: 'metoder', label: 'Metoder', icon: '⚡' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('uge');
  const [strengthDay, setStrengthDay] = useState(strengthProgram.days[0]?.id ?? '');

  return (
    <div className="app">
      {tab === 'uge' && (
        <WeekView
          weeks={weeks}
          strengthDays={strengthProgram.days}
          today={new Date()}
          onOpenStrength={(id) => {
            setStrengthDay(id);
            setTab('styrke');
            window.scrollTo(0, 0);
          }}
        />
      )}
      {tab === 'kalender' && (
        <CalendarView
          weeks={weeks}
          strengthDays={strengthProgram.days}
          today={new Date()}
          onOpenStrength={(id) => {
            setStrengthDay(id);
            setTab('styrke');
            window.scrollTo(0, 0);
          }}
        />
      )}
      {tab === 'styrke' && <StrengthView program={strengthProgram} selected={strengthDay} onSelect={setStrengthDay} />}
      {tab === 'metoder' && <MethodsView methods={trainingMethods} />}
      {tab === 'data' && <DataView today={new Date()} />}

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
