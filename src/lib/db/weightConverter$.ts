import { DEFAULT_WEIGHT_UNIT } from '$lib/constants';
import { syncedObservable } from '$lib/db/syncedObservable';
import type { WeightUnit } from '$lib/types';

export type WeightConverter = {
	unit: WeightUnit;
	round: boolean;
};

export const weightConverter$ = syncedObservable<WeightConverter>('weightConverter', {
	unit: DEFAULT_WEIGHT_UNIT,
	round: false
});
