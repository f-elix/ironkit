import { triplit } from '$lib/db/triplit';
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const workoutId = params.id;
	const workout = await triplit.fetchOne(triplit.query('workouts').Where('id', '=', workoutId));
	if (!workout) {
		throw error(404, 'Workout not found');
	}

	return {
		metaData: {
			title: `Workout - ${workout.title ?? 'Untitled'}`
		}
	};
};
