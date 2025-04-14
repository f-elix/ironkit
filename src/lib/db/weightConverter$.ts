import { DEFAULT_WEIGHT_UNIT } from '$lib/constants';
import type { WeightUnit } from '$lib/types';
import { syncedObservable } from './syncedObservable';

export type WeightConverter = {
	unit: WeightUnit;
	round: boolean;
};

export const weightConverter$ = syncedObservable<WeightConverter>('weightConverter', {
	unit: DEFAULT_WEIGHT_UNIT,
	round: false
});
