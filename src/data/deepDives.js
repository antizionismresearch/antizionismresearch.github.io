import { allExamples } from './db.js';
import { indexDeepDives } from '../lib/deepDives.mjs';

export const deepDives = Object.values(import.meta.glob('./case-studies/*.json', { eager: true, import: 'default' }));
export const deepDivesByEntry = indexDeepDives(deepDives, allExamples);
