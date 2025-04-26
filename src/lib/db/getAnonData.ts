import { ANON_USER_ID } from '$lib/constants';
import { COLLECTION_NAMES } from '$lib/db/constants';
import { triplit } from '$lib/db/triplit';

export const getAnonData = async () => {
	return Promise.all(
		COLLECTION_NAMES.map((collectionName) => {
			const query = triplit.query(collectionName).Where('userId', '=', ANON_USER_ID);
			// @ts-expect-error - Since we're not refining the query further, this is valid code but TS doesn't know that
			return triplit.fetch(query, { policy: 'local-only', syncStatus: 'pending' });
		})
	);
};
