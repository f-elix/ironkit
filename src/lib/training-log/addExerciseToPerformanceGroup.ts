import type { PerformanceGroup, Exercise } from '$lib/jazz/types';
import { DEFAULT_WEIGHT_UNIT } from '$lib/constants';
import { Performance, PerformanceSet } from '$lib/jazz/schema';

export const addExerciseToPerformanceGroup = (
	performanceGroup: PerformanceGroup,
	exercise: Exercise,
	workoutDate?: Date
) => {
	if (!performanceGroup.performances.$isLoaded) {
		return;
	}
	const lastPerformance = performanceGroup.performances.at(-1);
	const lastOrder = lastPerformance?.$isLoaded ? lastPerformance.groupOrder : 0;
	const groupOrder = lastOrder + 1;

	const initialSet = PerformanceSet.create({
		weight: undefined,
		reps: undefined,
		durationSeconds: undefined,
		note: undefined,
		performanceOrder: 1
	});

	const performance = Performance.create({
		performanceGroupId: performanceGroup.$jazz.id,
		exercise,
		performanceSets: [initialSet],
		groupOrder,
		weightUnit: DEFAULT_WEIGHT_UNIT,
		workoutId: performanceGroup.workoutId,
		workoutDate
	});

	performanceGroup.performances.$jazz.push(performance);

	// Add to exercise's reverse-lookup list
	if (exercise.performances.$isLoaded) {
		exercise.performances.$jazz.push(performance);
	}
};
