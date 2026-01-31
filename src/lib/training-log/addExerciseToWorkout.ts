import { DEFAULT_PERFORMANCE_GROUP_LABEL, DEFAULT_WEIGHT_UNIT } from '$lib/constants';
import { api } from '$convex/_generated/api';
import type { Id } from '$convex/_generated/dataModel';
import type { ConvexClient } from 'convex/browser';

export const addExerciseToWorkout = async (
	client: ConvexClient,
	workoutId: Id<'workouts'>,
	exerciseId: Id<'exercises'>,
	workoutOrder: number
) => {
	const performanceGroupId = await client.mutation(api.performanceGroups.create, {
		workoutId,
		workoutOrder,
		label: DEFAULT_PERFORMANCE_GROUP_LABEL
	});

	const performanceId = await client.mutation(api.performances.create, {
		performanceGroupId,
		exerciseId,
		workoutId,
		groupOrder: 0,
		weightUnit: DEFAULT_WEIGHT_UNIT
	});

	const performanceSetId = await client.mutation(api.performanceSets.create, {
		performanceId,
		performanceOrder: 0
	});

	return { performanceGroupId, performanceId, performanceSetId };
};
