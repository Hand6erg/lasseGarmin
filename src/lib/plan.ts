import { decryptBlob, type EncryptedBlob } from './crypto';
import { sortWeeks } from './logic';
import type { Method, StrengthProgram, WeekPlan } from './types';

// The whole plan is published as one encrypted file (built in the private repo).
export interface PlanData {
  weeks: WeekPlan[];
  strength: StrengthProgram;
  methods: Method[];
}

export const STORAGE_KEY = 'traeningsplan-kode';

export function readSavedPassword(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function savePassword(pw: string | null) {
  try {
    if (pw) localStorage.setItem(STORAGE_KEY, pw);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* private mode – just don't remember it */
  }
}

export async function fetchBlob(path: string): Promise<EncryptedBlob> {
  const res = await fetch(path, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return (await res.json()) as EncryptedBlob;
}

export async function decryptPlan(blob: EncryptedBlob, password: string): Promise<PlanData> {
  const data = await decryptBlob<PlanData>(blob, password);
  return { ...data, weeks: sortWeeks(data.weeks) };
}
