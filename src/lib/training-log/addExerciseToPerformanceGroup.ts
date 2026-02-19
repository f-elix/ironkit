import type { PerformanceGroup } from '$lib/db/types';
import { DEFAULT_WEIGHT_UNIT } from '$lib/constants';
import { api } from '$convex/_generated/api';
import type { Id } from '$convex/_generated/dataModel';
import type { ConvexClient } from 'convex/browser';

export const addExerciseToPerformanceGroup = async (
	client: ConvexClient,
	performanceGroup: PerformanceGroup,
	exerciseId: Id<'exercises'>,
	groupOrder: number
) => {
	if (!performanceGroup.workoutId) {
		throw new Error('Cannot add workout exercise to a program workout group');
	}

	// Use atomic mutation to create both performance and initial set in one transaction
	const { performanceId, performanceSetId } = await client.mutation(
		api.performances.createWithInitialSet,
		{
			performanceGroupId: performanceGroup._id,
			exerciseId,
			groupOrder,
			workoutId: performanceGroup.workoutId,
			weightUnit: DEFAULT_WEIGHT_UNIT
		}
	);

	return { performanceId, performanceSetId };
};
