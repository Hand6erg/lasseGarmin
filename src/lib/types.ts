// Datamodellen for planen. Planen bygges og krypteres i det private repo (plan/weeks/*.json)
// og hentes som public/data/plan.enc.json – siden dekrypterer den i browseren.

export type SessionType = 'styrke' | 'løb' | 'svøm' | 'cykel' | 'fri' | 'andet';

export interface Session {
  /** Dato for sessionen, YYYY-MM-DD */
  date: string;
  type: SessionType;
  /** Kort titel, fx "Long run" eller "Styrke — fuld krop" */
  title: string;
  /** Mål/target, fx "9–10 km, Z1-Z2, HR <150" */
  target?: string;
  /** Ekstra punkter der vises når man folder sessionen ud */
  details?: string[];
  /** Henvisning til et styrkepas i styrkeprogram.json, fx "mandag" eller "onsdag" */
  strengthDay?: string;
}

export interface WeekPlan {
  year: number;
  week: number;
  /** Mandag i ugen, YYYY-MM-DD */
  start: string;
  /** Fx "Uge A" eller "Uge B i rotationen" */
  label?: string;
  /** Kort note til ugen */
  note?: string;
  sessions: Session[];
}

export interface Exercise {
  name: string;
  sets: string;
  rest?: string;
  note?: string;
}

export interface StrengthDay {
  id: string;
  title: string;
  duration?: string;
  warmup?: string;
  intro?: string;
  exercises: Exercise[];
  core?: Exercise[];
}

export interface StrengthProgram {
  updated: string;
  days: StrengthDay[];
  progression: string[];
}

export interface Method {
  name: string;
  points: string[];
  inPlan?: string;
}
