import type { Exercise } from '$lib/db/types';

/**
 * 'assisted' has been removed but is still part of the db schema
 * because its technically a breaking change.
 */
export const exerciseLoadType = (exercise: Maybe<Exercise>) => {
	if (exercise?.loadType === 'assisted') {
		return;
	}
	return exercise?.loadType;
};
