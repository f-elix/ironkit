import { COLLECTION_NAMES } from '$lib/db/constants';
import { triplit } from '$lib/db/triplit';

export const loadDb = () => {
	COLLECTION_NAMES.forEach((collection) => {
		triplit.subscribeBackground(triplit.query(collection));
	});
};
