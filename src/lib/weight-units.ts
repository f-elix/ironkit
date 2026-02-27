import type { WeightUnit } from '$lib/types';

const MODIFIER = 2.20462;

export const getAltUnit = (unit: WeightUnit): WeightUnit => (unit === 'kg' ? 'lbs' : 'kg');

export const kgToLbs = (kg: number) => +(kg * MODIFIER).toFixed(1);

export const lbsToKg = (lbs: number) => +(lbs / MODIFIER).toFixed(1);
