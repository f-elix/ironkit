import { ANON_USER_ID } from '$lib/constants';
import { triplit } from '$lib/db/triplit';

export const userId = () => {
	return triplit.vars?.$token?.sub ?? ANON_USER_ID;
};
