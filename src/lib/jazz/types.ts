import {
	ProgramRun as ProgramRunSchema,
	ProgramRunSession as ProgramRunSessionSchema,
	ProgramWorkout as ProgramWorkoutSchema,
	Workout as WorkoutSchema
} from '$lib/jazz/schema';
import { PERFORMANCE_GROUPS_RESOLUTION } from '$lib/jazz/workout';
import type { co } from 'jazz-tools';

export type ProgramRun = co.loaded<typeof ProgramRunSchema>;
export type ProgramWorkout = co.loaded<typeof ProgramWorkoutSchema>;
export type Workout = co.loaded<typeof WorkoutSchema>;
export type ProgramRunSession = co.loaded<typeof ProgramRunSessionSchema>;

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
