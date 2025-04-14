import { DEFAULT_WEIGHT_UNIT } from '$lib/constants';
import { syncedObservable } from '$lib/db/syncedObservable';
import type { WeightUnit } from '$lib/types';

export type LoadPercentageCalculator = {
	unit: WeightUnit;
	round: boolean;
};

export const loadPercentageCalculator$ = syncedObservable<LoadPercentageCalculator>(
	'loadPercentageCalculator',
	{
		unit: DEFAULT_WEIGHT_UNIT,
		round: false
	}
);
