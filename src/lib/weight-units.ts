import type { WeightUnit } from '$lib/types';

const MODIFIER = 2.20462;

export const getAltUnit = (unit: WeightUnit): WeightUnit => (unit === 'kg' ? 'lbs' : 'kg');

export const kgToLbs = (kg: number) => +(kg * MODIFIER).toFixed(1);

export const lbsToKg = (lbs: number) => +(lbs / MODIFIER).toFixed(1);

export const convertWeightTo = (weight: number, unit: WeightUnit) =>
	unit === 'kg' ? lbsToKg(weight) : kgToLbs(weight);

export const convertWeightFrom = (weight: number, unit: WeightUnit) => {
	return {
		toKg: () => {
			return unit === 'kg' ? weight : lbsToKg(weight);
		},
		toLbs: () => {
			return unit === 'lbs' ? weight : kgToLbs(weight);
		}
	};
};
