import { DEFAULT_WEIGHT_UNIT } from '$lib/constants';
import {
	Performance,
	PerformanceGroup,
	PerformanceSet,
	ProgramWorkout,
	Workout,
	type WeightUnit
} from '$lib/jazz/schema';
import type { ResolvedWorkout } from '$lib/jazz/types';
import type { co } from 'jazz-tools';

export const PERFORMANCE_GROUPS_RESOLUTION = {
	$each: {
		performances: {
			$each: {
				exercise: true,
				performanceSets: {
					$each: true
				}
			}
		}
	}
} as const;

export type WorkoutData = ResolvedWorkout;

export type ResolvedProgramWorkout = co.loaded<
	typeof ProgramWorkout,
	{
		performanceGroups: typeof PERFORMANCE_GROUPS_RESOLUTION;
	}
>;

type TemplatePerformanceGroupData = WorkoutData['performanceGroups'][number];
type TemplatePerformanceData = TemplatePerformanceGroupData['performances'][number];

const createPerformanceFromTemplate = (performance: TemplatePerformanceData) => {
	const newPerformance = Performance.create({
		performanceGroupId: '',
		exercise: performance.exercise,
		groupOrder: performance.groupOrder,
		weightUnit: performance.weightUnit,
		note: performance.note,
		performanceSets: performance.performanceSets.map((set) => {
			return PerformanceSet.create({
				reps: undefined,
				durationSeconds: undefined,
				note: undefined,
				performanceOrder: set.performanceOrder
			});
		})
	});
	return newPerformance;
};

const createPerformanceGroupFromTemplate = (group: TemplatePerformanceGroupData) => {
	const performances = group.performances.map(createPerformanceFromTemplate);
	const newGroup = PerformanceGroup.create({
		workoutOrder: group.workoutOrder,
		label: group.label,
		performances
	});
	return newGroup;
};

const linkPerformanceGroupsToWorkout = (
	performanceGroups: ReturnType<typeof createPerformanceGroupFromTemplate>[],
	workoutId: string
) => {
	performanceGroups.forEach((group) => {
		group.$jazz.set('workoutId', workoutId);
		group.performances.forEach((performance) => {
			performance.$jazz.set('performanceGroupId', group.$jazz.id);
		});
	});
};

const denormalizeWorkoutDataToPerformances = (
	performanceGroups: ReturnType<typeof createPerformanceGroupFromTemplate>[],
	workoutDate: Date,
	workoutId: string
) => {
	performanceGroups.forEach((group) => {
		group.performances.forEach((performance) => {
			// Set denormalized workout data for efficient querying
			performance.$jazz.set('workoutDate', workoutDate);
			performance.$jazz.set('workoutId', workoutId);

			// Add to exercise.performances for reverse index lookup
			const exercise = performance.exercise;
			if (exercise) {
				exercise.performances.$jazz.push(performance);
			}
		});
	});
};

export const createWorkoutFromTemplate = async ({
	workoutId,
	date,
	bodyweight,
	bodyweightUnit,
	notes
}: {
	workoutId: string;
	date?: Date;
	bodyweight?: number;
	bodyweightUnit?: WeightUnit;
	notes?: string;
}) => {
	const workout = await Workout.load(workoutId, {
		resolve: {
			performanceGroups: PERFORMANCE_GROUPS_RESOLUTION
		}
	});
	if (!workout.$isLoaded) {
		throw new Error('Workout not found');
	}
	const performanceGroups = workout.performanceGroups.map(createPerformanceGroupFromTemplate);
	const workoutDate = date ?? new Date();
	const newWorkout = Workout.create({
		title: workout?.title ?? '',
		date: workoutDate,
		notes: notes ?? workout?.notes ?? '',
		bodyweight: bodyweight || undefined,
		bodyweightUnit: bodyweightUnit ?? workout?.bodyweightUnit ?? DEFAULT_WEIGHT_UNIT,
		performanceGroups
	});
	linkPerformanceGroupsToWorkout(performanceGroups, newWorkout.$jazz.id);
	denormalizeWorkoutDataToPerformances(performanceGroups, workoutDate, newWorkout.$jazz.id);
	return newWorkout;
};

export const createWorkoutFromProgramWorkout = (programWorkout: ResolvedProgramWorkout) => {
	const performanceGroups = programWorkout.performanceGroups.map(
		createPerformanceGroupFromTemplate
	);
	const workoutDate = new Date();
	const workout = Workout.create({
		title: programWorkout.label ?? programWorkout.trackKey,
		date: workoutDate,
		notes: programWorkout.notes,
		performanceGroups
	});
	linkPerformanceGroupsToWorkout(performanceGroups, workout.$jazz.id);
	denormalizeWorkoutDataToPerformances(performanceGroups, workoutDate, workout.$jazz.id);
	return workout;
};
