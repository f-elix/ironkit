import { tools } from '$lib/data/tools';
import { triplit } from '$lib/db/triplit';

export const load = async () => {
	const workouts = await triplit.fetch(triplit.query('workouts').Order('date', 'DESC'));
	return {
		tool: tools.trainingLog,
		workouts
	};
};
