import type { Method, StrengthProgram, WeekPlan } from './types';
import { sortWeeks } from './logic';
import program from '../data/styrkeprogram.json';
import methods from '../data/metoder.json';

// Alle ugeplaner i src/data/weeks bliver taget med automatisk ved build.
const files = import.meta.glob<WeekPlan>('../data/weeks/*.json', { eager: true, import: 'default' });

export const weeks: WeekPlan[] = sortWeeks(Object.values(files));
export const strengthProgram = program as StrengthProgram;
export const trainingMethods = methods as Method[];
