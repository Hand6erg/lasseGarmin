// Last weight/reps per exercise. Kept only in this browser (localStorage), never sent anywhere.
// Each save replaces the previous one – it's a "what did I do last time" note, not a history.

export interface LastSet {
  kg?: string;
  reps?: string;
  /** YYYY-MM-DD */
  date: string;
}

export type SetLog = Record<string, LastSet>;

const KEY = 'traeningsplan-sidst';

export function loadLog(): SetLog {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? (parsed as SetLog) : {};
  } catch {
    return {};
  }
}

export function saveLog(log: SetLog) {
  try {
    localStorage.setItem(KEY, JSON.stringify(log));
  } catch {
    /* private mode or full storage – keep it in memory only */
  }
}

/** Trim the inputs; returns null when there's nothing to save. */
export function makeEntry(kg: string, reps: string, date: string): LastSet | null {
  const k = kg.trim().replace('.', ',');
  const r = reps.trim();
  if (!k && !r) return null;
  return { ...(k && { kg: k }), ...(r && { reps: r }), date };
}

/** "130 kg × 5", "kropsvægt × 10, 8, 7" or "60 kg" */
export function formatEntry(e: LastSet): string {
  const kg = e.kg ? `${e.kg} kg` : 'kropsvægt';
  return e.reps ? `${kg} × ${e.reps}` : kg;
}
