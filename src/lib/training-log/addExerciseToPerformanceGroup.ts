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
	const performanceId = await client.mutation(api.performances.create, {
		performanceGroupId: performanceGroup._id,
		exerciseId,
		groupOrder,
		workoutId: performanceGroup.workoutId,
		weightUnit: DEFAULT_WEIGHT_UNIT
	});

	const performanceSetId = await client.mutation(api.performanceSets.create, {
		performanceId,
		performanceOrder: 0
	});

	return { performanceId, performanceSetId };
};
