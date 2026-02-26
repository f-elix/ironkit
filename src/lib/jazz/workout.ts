import { DEFAULT_WEIGHT_UNIT } from "$lib/constants";
import {
	Performance,
	PerformanceGroup,
	PerformanceSet,
	ProgramWorkout,
	Workout
} from "$lib/jazz/schema";
import type { co } from "jazz-tools";

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

export type TemplateWorkoutData = co.loaded<typeof Workout, {
	performanceGroups: typeof PERFORMANCE_GROUPS_RESOLUTION;
}>;

export type ResolvedProgramWorkout = co.loaded<typeof ProgramWorkout, {
	performanceGroups: typeof PERFORMANCE_GROUPS_RESOLUTION;
}>;

type TemplatePerformanceGroupData = TemplateWorkoutData['performanceGroups'][number]
type TemplatePerformanceData = TemplatePerformanceGroupData['performances'][number]

const createPerformanceFromTemplate = (performance: TemplatePerformanceData) => {
	const newPerformance = Performance.create({
		performanceGroupId: '',
		exercise: performance.exercise,
		groupOrder: performance.groupOrder,
		weightUnit: performance.weightUnit,
		note: performance.note,
		updatedAt: new Date(),
		performanceSets: performance.performanceSets.map((set) => {
			return PerformanceSet.create({
				reps: undefined,
				durationSeconds: undefined,
				note: undefined,
				performanceOrder: set.performanceOrder,
				updatedAt: new Date(),
			});
		})
	})
	return newPerformance;
}

const createPerformanceGroupFromTemplate = (group: TemplatePerformanceGroupData) => {
	const performances = group.performances.map(createPerformanceFromTemplate);
	const newGroup = PerformanceGroup.create({
		workoutOrder: group.workoutOrder,
		label: group.label,
		updatedAt: new Date(),
		performances,
	});
	return newGroup;
}

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
}

export const createWorkoutFromTemplate = async (workoutId: string) => {
	const workout = await Workout.load(workoutId, {
		resolve: {
			performanceGroups: PERFORMANCE_GROUPS_RESOLUTION
		}
	});
	if (!workout.$isLoaded) {
		throw new Error('Workout not found');
	}
	const performanceGroups = workout.performanceGroups.map(createPerformanceGroupFromTemplate);
	const newWorkout = Workout.create({
		title: workout?.title ?? '',
		date: workout?.date ?? new Date(),
		notes: workout?.notes ?? '',
		bodyweight: workout?.bodyweight ?? undefined,
		bodyweightUnit: workout?.bodyweightUnit ?? DEFAULT_WEIGHT_UNIT,
		performanceGroups,
		updatedAt: new Date(),
	});
	linkPerformanceGroupsToWorkout(performanceGroups, newWorkout.$jazz.id);
	return newWorkout;
};

export const createWorkoutFromProgramWorkout = (programWorkout: ResolvedProgramWorkout) => {
	const performanceGroups = programWorkout.performanceGroups.map(createPerformanceGroupFromTemplate);
	const workout = Workout.create({
		title: programWorkout.label ?? programWorkout.trackKey,
		date: new Date(),
		notes: programWorkout.notes,
		performanceGroups,
		updatedAt: new Date()
	});
	linkPerformanceGroupsToWorkout(performanceGroups, workout.$jazz.id);
	return workout;
};