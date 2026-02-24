import { co, z } from 'jazz-tools';

export const WEIGHT_UNITS = ['kg', 'lbs'] as const;
export const GENDER_CLASSES = ['male', 'female'] as const;
export const EXERCISE_LOAD_TYPES = ['weighted', 'bodyweight', 'assisted'] as const;
export const EXERCISE_EXECUTION_TYPES = ['reps', 'time'] as const;
export const PROGRAM_TEMPLATE_STATUSES = ['draft', 'published', 'archived'] as const;
export const PROGRAM_RUN_STATUSES = ['active', 'paused', 'completed', 'canceled', 'archived'] as const;

export type WeightUnit = (typeof WEIGHT_UNITS)[number];
export type GenderClass = (typeof GENDER_CLASSES)[number];
export type ExerciseLoadType = (typeof EXERCISE_LOAD_TYPES)[number];
export type ExerciseExecutionType = (typeof EXERCISE_EXECUTION_TYPES)[number];
export type ProgramTemplateStatus = (typeof PROGRAM_TEMPLATE_STATUSES)[number];
export type ProgramRunStatus = (typeof PROGRAM_RUN_STATUSES)[number];

export interface ProgramTargetSnapshot {
	targetSetRange: string;
	targetRepsRange?: string;
	targetDuration?: string;
}

const WEIGHT_UNIT_ENUM = z.enum(WEIGHT_UNITS);
const GENDER_CLASS_ENUM = z.enum(GENDER_CLASSES);
const EXERCISE_LOAD_TYPE_ENUM = z.enum(EXERCISE_LOAD_TYPES);
const EXERCISE_EXECUTION_TYPE_ENUM = z.enum(EXERCISE_EXECUTION_TYPES);
const PROGRAM_TEMPLATE_STATUS_ENUM = z.enum(PROGRAM_TEMPLATE_STATUSES);
const PROGRAM_RUN_STATUS_ENUM = z.enum(PROGRAM_RUN_STATUSES);

const PROGRAM_TARGET_SNAPSHOT_SCHEMA = z.object({
	targetSetRange: z.string(),
	targetRepsRange: z.optional(z.string()),
	targetDuration: z.optional(z.string())
});

export const USER_OWNED_ENTITY_PERMISSIONS = {
	onInlineCreate: 'extendsContainer'
} as const;

export const WeightConverter = co
	.map({
		unit: WEIGHT_UNIT_ENUM,
		round: z.boolean(),
		updatedAt: z.number()
	})
	.withPermissions(USER_OWNED_ENTITY_PERMISSIONS);

export const CoefficientCalculator = co
	.map({
		genderClass: GENDER_CLASS_ENUM,
		totalUnit: WEIGHT_UNIT_ENUM,
		bodyweightUnit: WEIGHT_UNIT_ENUM,
		updatedAt: z.number()
	})
	.withPermissions(USER_OWNED_ENTITY_PERMISSIONS);

export const LoadPercentageCalculator = co
	.map({
		unit: WEIGHT_UNIT_ENUM,
		round: z.boolean(),
		updatedAt: z.number()
	})
	.withPermissions(USER_OWNED_ENTITY_PERMISSIONS);

export const PlateCalculator = co
	.map({
		barWeight: z.number(),
		heavyCollars: z.boolean(),
		allowNonStandardConfig: z.boolean(),
		updatedAt: z.number()
	})
	.withPermissions(USER_OWNED_ENTITY_PERMISSIONS);

export const Exercise = co
	.map({
		name: z.string(),
		executionType: EXERCISE_EXECUTION_TYPE_ENUM,
		loadType: EXERCISE_LOAD_TYPE_ENUM,
		muscleGroups: z.array(z.string()),
		updatedAt: z.number()
	})
	.withPermissions(USER_OWNED_ENTITY_PERMISSIONS);

export const Workout = co
	.map({
		title: z.string(),
		date: z.number(),
		notes: z.optional(z.string()),
		bodyweight: z.optional(z.number()),
		bodyweightUnit: z.optional(WEIGHT_UNIT_ENUM),
		get programRun() {
			return co.optional(ProgramRun);
		},
		get programRunSession() {
			return co.optional(ProgramRunSession);
		},
		get sourceProgramWorkout() {
			return co.optional(ProgramWorkout);
		},
		get performanceGroups() {
			return co.list(PerformanceGroup);
		},
		updatedAt: z.number()
	})
	.withPermissions(USER_OWNED_ENTITY_PERMISSIONS);

export const PerformanceGroup = co
	.map({
		get workout() {
			return co.optional(Workout);
		},
		get programWorkout() {
			return co.optional(ProgramWorkout);
		},
		get performances() {
			return co.list(Performance);
		},
		label: z.optional(z.string()),
		workoutOrder: z.number(),
		updatedAt: z.number()
	})
	.withPermissions(USER_OWNED_ENTITY_PERMISSIONS);

export const Performance = co
	.map({
		performanceGroup: PerformanceGroup,
		exercise: Exercise,
		get performanceSets() {
			return co.list(PerformanceSet);
		},
		get programWorkoutExerciseTargets() {
			return co.list(ProgramWorkoutExerciseTarget);
		},
		groupOrder: z.number(),
		note: z.optional(z.string()),
		programTargets: z.optional(z.array(PROGRAM_TARGET_SNAPSHOT_SCHEMA)),
		weightUnit: WEIGHT_UNIT_ENUM,
		updatedAt: z.number()
	})
	.withPermissions(USER_OWNED_ENTITY_PERMISSIONS);

export const PerformanceSet = co
	.map({
		performance: Performance,
		weight: z.optional(z.number()),
		reps: z.optional(z.number()),
		durationSeconds: z.optional(z.number()),
		note: z.optional(z.string()),
		performanceOrder: z.number(),
		updatedAt: z.number()
	})
	.withPermissions(USER_OWNED_ENTITY_PERMISSIONS);

export const ProgramWorkoutExerciseTarget = co
	.map({
		performance: Performance,
		targetSetRange: z.string(),
		targetRepsRange: z.optional(z.string()),
		targetDuration: z.optional(z.string()),
		targetOrder: z.number(),
		updatedAt: z.number()
	})
	.withPermissions(USER_OWNED_ENTITY_PERMISSIONS);

export const ProgramTemplate = co
	.map({
		name: z.string(),
		notes: z.optional(z.string()),
		totalWeeks: z.number(),
		status: z.enum(PROGRAM_TEMPLATE_STATUSES),
		get programWorkouts() {
			return co.list(ProgramWorkout);
		},
		updatedAt: z.number()
	})
	.withPermissions(USER_OWNED_ENTITY_PERMISSIONS);

export const ProgramWorkout = co
	.map({
		programTemplate: ProgramTemplate,
		get performanceGroups() {
			return co.list(PerformanceGroup);
		},
		weekNumber: z.number(),
		slotOrder: z.number(),
		trackKey: z.string(),
		label: z.optional(z.string()),
		notes: z.optional(z.string()),
		updatedAt: z.number()
	})
	.withPermissions(USER_OWNED_ENTITY_PERMISSIONS);

export const ProgramRun = co
	.map({
		programTemplate: ProgramTemplate,
		status: PROGRAM_RUN_STATUS_ENUM,
		startedAt: z.number(),
		endedAt: z.optional(z.number()),
		get programRunSessions() {
			return co.list(ProgramRunSession);
		},
		updatedAt: z.number()
	})
	.withPermissions(USER_OWNED_ENTITY_PERMISSIONS);

export const ProgramRunSession = co
	.map({
		programRun: ProgramRun,
		programWorkout: ProgramWorkout,
		get workout() {
			return co.optional(Workout);
		},
		skippedAt: z.optional(z.number()),
		updatedAt: z.number()
	})
	.withPermissions(USER_OWNED_ENTITY_PERMISSIONS);

export const JAZZ_ENTITY_SCHEMAS = {
	weightConverter: WeightConverter,
	coefficientCalculator: CoefficientCalculator,
	loadPercentageCalculator: LoadPercentageCalculator,
	plateCalculator: PlateCalculator,
	exercises: Exercise,
	workouts: Workout,
	performanceGroups: PerformanceGroup,
	performances: Performance,
	performanceSets: PerformanceSet,
	programWorkoutExerciseTargets: ProgramWorkoutExerciseTarget,
	programTemplates: ProgramTemplate,
	programWorkouts: ProgramWorkout,
	programRuns: ProgramRun,
	programRunSessions: ProgramRunSession
} as const;

export const JazzUserSpace = co
	.map({
		weightConverter: co.list(WeightConverter),
		coefficientCalculator: co.list(CoefficientCalculator),
		loadPercentageCalculator: co.list(LoadPercentageCalculator),
		plateCalculator: co.list(PlateCalculator),
		exercises: co.list(Exercise),
		workouts: co.list(Workout),
		programTemplates: co.list(ProgramTemplate),
		programRuns: co.list(ProgramRun),
	})
	.withPermissions({
		onInlineCreate: 'extendsContainer'
	});

export const JazzAccount = co
	.account({
		profile: co.profile(),
		root: JazzUserSpace
	});
