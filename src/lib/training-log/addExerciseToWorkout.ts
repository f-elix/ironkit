import { triplit } from '$lib/db/triplit';
import { userId } from '$lib/db/userId';

export const addExerciseToWorkout = async (
	workoutId: string,
	exerciseId: string,
	workoutOrder: number
) => {
	const result = await triplit.transact(async (tx) => {
		const performanceGroup = await tx.insert('performanceGroups', {
			userId: userId(),
			workoutId,
			workoutOrder
		});

		const performance = await tx.insert('performances', {
			userId: userId(),
			performanceGroupId: performanceGroup.id,
			exerciseId,
			groupOrder: 0,
			workoutId
		});

		const performanceSet = await tx.insert('performanceSets', {
			userId: userId(),
			performanceId: performance.id,
			performanceOrder: 0
		});

		return { performanceGroup, performance, performanceSet };
	});
	return result;
};
