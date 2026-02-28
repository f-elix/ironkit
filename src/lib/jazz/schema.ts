import { DEFAULT_BAR_WEIGHT, DEFAULT_GENDER_CLASS, DEFAULT_WEIGHT_UNIT } from '$lib/constants';
import { co, z } from 'jazz-tools';

export const WEIGHT_UNITS = ['kg', 'lbs'] as const;
const GENDER_CLASSES = ['male', 'female'] as const;
const EXERCISE_LOAD_TYPES = ['weighted', 'bodyweight'] as const;
const EXERCISE_EXECUTION_TYPES = ['reps', 'time'] as const;
const PROGRAM_TEMPLATE_STATUSES = ['draft', 'published', 'archived'] as const;
const PROGRAM_RUN_STATUSES = [
	'active',
	'paused',
	'completed',
	'canceled',
	'archived'
] as const;

export type WeightUnit = (typeof WEIGHT_UNITS)[number];

export type ProgramTarget = {
	targetSetRange: string;
	targetRepsRange?: string;
	targetDuration?: string;
};

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

const USER_OWNED_ENTITY_PERMISSIONS = {
	onInlineCreate: 'extendsContainer'
} as const;

const WeightConverter = co
	.map({
		unit: WEIGHT_UNIT_ENUM,
		round: z.boolean()
	})
	.withPermissions(USER_OWNED_ENTITY_PERMISSIONS);

const CoefficientCalculator = co
	.map({
		genderClass: GENDER_CLASS_ENUM,
		totalUnit: WEIGHT_UNIT_ENUM,
		bodyweightUnit: WEIGHT_UNIT_ENUM
	})
	.withPermissions(USER_OWNED_ENTITY_PERMISSIONS);

const LoadPercentageCalculator = co
	.map({
		unit: WEIGHT_UNIT_ENUM,
		round: z.boolean()
	})
	.withPermissions(USER_OWNED_ENTITY_PERMISSIONS);

const PlateCalculator = co
	.map({
		barWeight: z.number(),
		heavyCollars: z.boolean(),
		allowNonStandardConfig: z.boolean()
	})
	.withPermissions(USER_OWNED_ENTITY_PERMISSIONS);

export const Exercise = co
	.map({
		name: z.string(),
		executionType: EXERCISE_EXECUTION_TYPE_ENUM,
		loadType: EXERCISE_LOAD_TYPE_ENUM,
		muscleGroups: z.array(z.string())
	})
	.withPermissions(USER_OWNED_ENTITY_PERMISSIONS);

export const Workout = co
	.map({
		title: z.string(),
		date: z.date(),
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
		}
	})
	.withPermissions(USER_OWNED_ENTITY_PERMISSIONS);

export const PerformanceGroup = co
	.map({
		workoutId: z.string().optional(),
		programWorkoutId: z.string().optional(),
		label: z.optional(z.string()),
		workoutOrder: z.number(),
		get performances() {
			return co.list(Performance);
		}
	})
	.withPermissions(USER_OWNED_ENTITY_PERMISSIONS);

export const Performance = co
	.map({
		performanceGroupId: z.string(),
		exercise: Exercise,
		get performanceSets() {
			return co.list(PerformanceSet);
		},
		groupOrder: z.number(),
		note: z.optional(z.string()),
		programTargets: z.optional(z.array(PROGRAM_TARGET_SNAPSHOT_SCHEMA)),
		weightUnit: WEIGHT_UNIT_ENUM
	})
	.withPermissions(USER_OWNED_ENTITY_PERMISSIONS);

export const PerformanceSet = co
	.map({
		weight: z.optional(z.number()),
		reps: z.optional(z.number()),
		durationSeconds: z.optional(z.number()),
		note: z.optional(z.string()),
		performanceOrder: z.number()
	})
	.withPermissions(USER_OWNED_ENTITY_PERMISSIONS);

export const ProgramTemplate = co
	.map({
		name: z.string(),
		notes: z.optional(z.string()),
		totalWeeks: z.number(),
		status: PROGRAM_TEMPLATE_STATUS_ENUM,
		get programWorkouts() {
			return co.list(ProgramWorkout);
		}
	})
	.withPermissions(USER_OWNED_ENTITY_PERMISSIONS);

export const ProgramWorkout = co
	.map({
		programTemplateId: z.string(),
		get performanceGroups() {
			return co.list(PerformanceGroup);
		},
		weekNumber: z.number(),
		slotOrder: z.number(),
		trackKey: z.string(),
		label: z.optional(z.string()),
		notes: z.optional(z.string())
	})
	.withPermissions(USER_OWNED_ENTITY_PERMISSIONS);

export const ProgramRun = co
	.map({
		programTemplate: ProgramTemplate,
		status: PROGRAM_RUN_STATUS_ENUM,
		startedAt: z.date(),
		endedAt: z.optional(z.date()),
		get programRunSessions() {
			return co.list(ProgramRunSession);
		}
	})
	.withPermissions(USER_OWNED_ENTITY_PERMISSIONS);

export const ProgramRunSession = co
	.map({
		programRunId: z.string(),
		programWorkoutId: z.string(),
		workoutId: z.optional(z.string()),
		skippedAt: z.optional(z.date())
	})
	.withPermissions(USER_OWNED_ENTITY_PERMISSIONS);

const AccountRoot = co
	.map({
		weightConverter: WeightConverter,
		coefficientCalculator: CoefficientCalculator,
		loadPercentageCalculator: LoadPercentageCalculator,
		plateCalculator: PlateCalculator,
		exercises: co.list(Exercise),
		workouts: co.list(Workout),
		programTemplates: co.list(ProgramTemplate),
		programRuns: co.list(ProgramRun)
	})
	.withPermissions({
		onInlineCreate: 'extendsContainer'
	});

export const IronkitAccount = co
	.account({
		profile: co.profile(),
		root: AccountRoot
	})
	.withMigration((account) => {
		if (!account.$jazz.has('root')) {
			account.$jazz.set('root', {
				weightConverter: WeightConverter.create({
					unit: DEFAULT_WEIGHT_UNIT,
					round: false
				}),
				coefficientCalculator: CoefficientCalculator.create({
					genderClass: DEFAULT_GENDER_CLASS,
					totalUnit: DEFAULT_WEIGHT_UNIT,
					bodyweightUnit: DEFAULT_WEIGHT_UNIT
				}),
				loadPercentageCalculator: LoadPercentageCalculator.create({
					unit: DEFAULT_WEIGHT_UNIT,
					round: false
				}),
				plateCalculator: PlateCalculator.create({
					barWeight: DEFAULT_BAR_WEIGHT,
					heavyCollars: false,
					allowNonStandardConfig: false
				}),
				exercises: [],
				workouts: [],
				programTemplates: [],
				programRuns: []
			});
		}
	});
