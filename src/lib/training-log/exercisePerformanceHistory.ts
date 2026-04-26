import type { Exercise, Performance } from '$lib/jazz/types';

export const removePerformanceFromExerciseHistory = async (
	exercise: Exercise,
	performanceId: string
) => {
	const loadedExercise = await exercise.$jazz.ensureLoaded({
		resolve: { performances: true }
	});

	loadedExercise.performances.$jazz.remove((performance) => performance.$jazz.id === performanceId);
};

export const addPerformanceToExerciseHistory = async (
	exercise: Exercise,
	performance: Performance
) => {
	const loadedExercise = await exercise.$jazz.ensureLoaded({
		resolve: { performances: true }
	});

	loadedExercise.performances.$jazz.remove(
		(existingPerformance) => existingPerformance.$jazz.id === performance.$jazz.id
	);
	loadedExercise.performances.$jazz.push(performance);

	return loadedExercise;
};

export const replacePerformanceExercise = async (
	performance: Performance,
	newExercise: Exercise
) => {
	const performanceId = performance.$jazz.id;
	const oldExercise = performance.exercise.$isLoaded ? performance.exercise : null;

	if (oldExercise?.$jazz.id === newExercise.$jazz.id) {
		return;
	}

	const loadedNewExercise = await newExercise.$jazz.ensureLoaded({
		resolve: { performances: true }
	});

	if (oldExercise) {
		await removePerformanceFromExerciseHistory(oldExercise, performanceId);
	}

	performance.$jazz.set('exercise', loadedNewExercise);
	loadedNewExercise.performances.$jazz.remove(
		(existingPerformance) => existingPerformance.$jazz.id === performanceId
	);
	loadedNewExercise.performances.$jazz.push(performance);
};
