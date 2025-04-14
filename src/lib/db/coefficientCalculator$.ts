import type { GenderClass } from '$lib/types';
import type { WeightUnit } from '$lib/types';
import { DEFAULT_GENDER_CLASS } from '$lib/constants';
import { DEFAULT_WEIGHT_UNIT } from '$lib/constants';
import { syncedObservable } from '$lib/db/syncedObservable';

export type CoefficientCalculator = {
	genderClass: GenderClass;
	totalUnit: WeightUnit;
	bodyweightUnit: WeightUnit;
};

export const coefficientCalculator$ = syncedObservable<CoefficientCalculator>('weightConverter', {
	genderClass: DEFAULT_GENDER_CLASS,
	totalUnit: DEFAULT_WEIGHT_UNIT,
	bodyweightUnit: DEFAULT_WEIGHT_UNIT
});
