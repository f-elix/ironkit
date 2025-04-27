import { ANON_USER_ID } from '$lib/constants';
import { COLLECTION_NAMES } from '$lib/db/constants';
import { triplit } from '$lib/db/triplit';
import type { CollectionName } from '$lib/db/types';

export const getAnonData = async () => {
	const anonCollections = {} as Record<CollectionName, { id: string }[]>;
	for await (const collectionName of COLLECTION_NAMES) {
		const query = triplit.query(collectionName).Where('userId', '=', ANON_USER_ID);
		// @ts-expect-error - Since we're not refining the query further, this is valid code but TS doesn't know that
		const result = await triplit.fetch(query, { policy: 'local-only', syncStatus: 'pending' });
		anonCollections[collectionName] = result;
	}
	return anonCollections;
};
