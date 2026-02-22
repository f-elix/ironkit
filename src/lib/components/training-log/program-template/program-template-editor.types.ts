import type { Doc, Id } from '$convex/_generated/dataModel';
import type { ProgramTemplateStatus } from '$lib/training-log/program-template-status';
export type CreateWorkoutMode = 'scratch' | 'copy';

export type WorkoutSummary = Pick<
	Doc<'programWorkouts'>,
	'_id' | 'weekNumber' | 'slotOrder' | 'trackKey' | 'label'
>;

export type WorkoutSummaryExerciseSet = {
	targetSetRange?: string;
	targetRepsRange?: string;
	targetDuration?: string;
};

export type WorkoutSummaryExercise = {
	name: string;
	executionType: 'reps' | 'time';
	sets: WorkoutSummaryExerciseSet[];
};

export type WorkoutSummaryGroup = {
	label?: string;
	exercises: WorkoutSummaryExercise[];
};

export type WorkoutSummaryWithGroups = WorkoutSummary & {
	groups: WorkoutSummaryGroup[];
};

export type WorkoutWeek = {
	weekNumber: number;
	items: WorkoutSummaryWithGroups[];
};

export type ProgramWorkoutExercise = Doc<'performances'> & {
	exercise: Doc<'exercises'> | null;
	exactSets: Doc<'programWorkoutExerciseTargets'>[];
};

export type ProgramWorkoutGroup = Doc<'performanceGroups'> & {
	exercises: ProgramWorkoutExercise[];
};

export type ProgramWorkoutDetails = Doc<'programWorkouts'> & {
	groups: ProgramWorkoutGroup[];
};

export type ProgramWorkoutDraft = {
	weekNumber?: number;
	trackKey?: string;
	label?: string;
	notes?: string;
};

export type ProgramTemplateDraft = {
	name?: string;
	notes?: string;
	totalWeeks?: number;
	status?: ProgramTemplateStatus;
};

type WorkoutMetaValues = {
	weekNumber: number;
	trackKey: string;
	label: string;
	notes: string;
};

export type WorkoutMetaField = keyof WorkoutMetaValues;

export type WorkoutMetaFieldValue = WorkoutMetaValues[WorkoutMetaField];

export type WorkoutMetaUpdate = {
	field: WorkoutMetaField;
	value: WorkoutMetaFieldValue;
};

export type GroupExerciseUpdate = {
	exerciseId?: Id<'exercises'>;
	note?: string;
};
