import { triplit } from '$lib/db/triplit';
import type { PerformanceGroup } from '$lib/db/types';
import { userId } from '$lib/db/userId';

export const addExerciseToPeformanceGroup = async (
	performanceGroup: PerformanceGroup,
	exerciseId: string,
	groupOrder: number
) => {
	const result = await triplit.transact(async (tx) => {
		const performance = await tx.insert('performances', {
			userId: userId(),
			performanceGroupId: performanceGroup.id,
			exerciseId,
			groupOrder,
			workoutId: performanceGroup.workoutId
		});

		return performance;
	});
	return result;
};
