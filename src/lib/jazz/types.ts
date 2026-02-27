import {
	ProgramRun as ProgramRunSchema,
	ProgramRunSession as ProgramRunSessionSchema,
	ProgramWorkout as ProgramWorkoutSchema,
	ProgramTemplate as ProgramTemplateSchema,
	Workout as WorkoutSchema,
	Exercise as ExerciseSchema,
	PerformanceGroup as PerformanceGroupSchema,
	Performance as PerformanceSchema,
	PerformanceSet as PerformanceSetSchema,
	ProgramWorkoutExerciseTarget as ProgramWorkoutExerciseTargetSchema
} from '$lib/jazz/schema';
import { PERFORMANCE_GROUPS_RESOLUTION } from '$lib/jazz/workout';
import type { co } from 'jazz-tools';

export type ProgramTemplate = co.loaded<typeof ProgramTemplateSchema>;
export type ProgramRun = co.loaded<typeof ProgramRunSchema>;
export type ProgramWorkout = co.loaded<typeof ProgramWorkoutSchema>;
export type Workout = co.loaded<typeof WorkoutSchema>;
export type ProgramRunSession = co.loaded<typeof ProgramRunSessionSchema>;
export type Exercise = co.loaded<typeof ExerciseSchema>;
export type PerformanceGroup = co.loaded<typeof PerformanceGroupSchema>;
export type Performance = co.loaded<typeof PerformanceSchema>;
export type PerformanceSet = co.loaded<typeof PerformanceSetSchema>;
export type ProgramWorkoutExerciseTarget = co.loaded<typeof ProgramWorkoutExerciseTargetSchema>;

export type ResolvedWorkout = co.loaded<
	typeof WorkoutSchema,
	{
		performanceGroups: typeof PERFORMANCE_GROUPS_RESOLUTION;
	}
>;

export type ResolvedProgramRun = co.loaded<
	typeof ProgramRunSchema,
	{
		programTemplate: {
			programWorkouts: {
				$each: {
					performanceGroups: typeof PERFORMANCE_GROUPS_RESOLUTION;
				};
			};
		};
		programRunSessions: {
			$each: true;
		};
	}
>;
