import type { Doc } from '$convex/_generated/dataModel';

export type Workout = Doc<'workouts'>;
export type PerformanceGroup = Doc<'performanceGroups'>;
export type Performance = Doc<'performances'>;
export type Exercise = Doc<'exercises'>;
export type PerformanceSet = Doc<'performanceSets'>;

export type WorkoutWithRelations = Workout & {
	performanceGroups: Array<
		PerformanceGroup & {
			performances: Array<
				Performance & {
					exercise: Exercise | null;
					sets: PerformanceSet[];
					workout?: Workout | null;
				}
			>;
		}
	>;
};
