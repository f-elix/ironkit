import { ANON_USER_ID } from '$lib/constants';
import { triplit } from '$lib/db/triplit';
import type { schema } from '$triplit/schema';
import type { CollectionNameFromModels } from '@triplit/client';

export type CollectionName = CollectionNameFromModels<typeof schema>;

const collectionNames = [
	'weightConverter',
	'coefficientCalculator',
	'plateCalculator',
	'loadPercentageCalculator',
	'workouts',
	'exercises',
	'muscleGroups',
	'performances'
] as const satisfies CollectionName[];

export const getAnonData = async () => {
	return Promise.all(
		collectionNames.map((collectionName) => {
			const query = triplit.query(collectionName).Where('userId', '=', ANON_USER_ID);
			return triplit.fetch(query, { policy: 'local-only', syncStatus: 'pending' });
		})
	);
};
