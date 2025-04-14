import { syncedObservable } from '$lib/db/syncedObservable';
import type { BarWeight } from '$lib/types';

export type PlateCalculator = {
	barWeight: BarWeight;
	heavyCollars: boolean;
	allowNonStandardConfig: boolean;
};

export const plateCalculator$ = syncedObservable<PlateCalculator>('plateCalculator', {
	barWeight: 20,
	heavyCollars: false,
	allowNonStandardConfig: false
});
