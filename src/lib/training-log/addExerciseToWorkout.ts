import { triplit } from '$lib/db/triplit';
import { userId } from '$lib/db/userId';

export const addExerciseToWorkout = async (
	workoutId: string,
	exerciseId: string,
	workoutOrder: number
) => {
	await triplit.transact(async (tx) => {
		const performanceGroup = await tx.insert('performanceGroups', {
			userId: userId(),
			workoutId,
			workoutOrder
		});

		await tx.insert('performances', {
			userId: userId(),
			performanceGroupId: performanceGroup.id,
			exerciseId,
			groupOrder: 0,
			workoutId
		});
	});
};
