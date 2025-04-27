import { COLLECTION_NAMES } from '$lib/db/constants';
import { triplit } from '$lib/db/triplit';

export const loadDb = () => {
	COLLECTION_NAMES.forEach((collection) => {
		// @ts-expect-error - Since we're not refining the query further, this is valid code but TS doesn't know that
		triplit.subscribeBackground(triplit.query(collection));
	});
};
