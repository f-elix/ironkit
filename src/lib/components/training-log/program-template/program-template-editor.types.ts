import type { Doc, Id } from '$convex/_generated/dataModel';

export type ProgramTemplateStatus = 'draft' | 'archived';
export type CreateWorkoutMode = 'scratch' | 'copy';

export type WorkoutSummary = Pick<
	Doc<'programWorkouts'>,
	'_id' | 'weekNumber' | 'slotOrder' | 'trackKey' | 'label'
>;

export type WorkoutWeek = {
	weekNumber: number;
	items: WorkoutSummary[];
};

type ExerciseOption = Pick<Doc<'exercises'>, '_id' | 'name'>;

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

type TemplateDisplay = {
	name: string;
	status: ProgramTemplateStatus;
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
