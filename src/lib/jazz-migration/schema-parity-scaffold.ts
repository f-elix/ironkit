import { CONVEX_ENTITY_TABLES, type ConvexEntityTable } from './preflight-guardrails';

export const WEIGHT_UNITS = ['kg', 'lbs'] as const;
export const GENDER_CLASSES = ['male', 'female'] as const;
export const EXERCISE_LOAD_TYPES = ['weighted', 'bodyweight', 'assisted'] as const;
export const EXERCISE_EXECUTION_TYPES = ['reps', 'time'] as const;
export const PROGRAM_TEMPLATE_STATUSES = ['draft', 'published', 'archived'] as const;
export const PROGRAM_RUN_STATUSES = ['active', 'paused', 'completed', 'canceled', 'archived'] as const;

export type JazzParityFieldType =
	| 'string'
	| 'number'
	| 'boolean'
	| 'string[]'
	| 'enum'
	| 'relation'
	| 'object[]';

export interface JazzParityFieldSpec {
	type: JazzParityFieldType;
	optional?: boolean;
	enumValues?: readonly string[];
	relationEntity?: ConvexEntityTable;
	description?: string;
}

export interface JazzParityEntitySpec {
	entity: ConvexEntityTable;
	ownerContainer: 'user-space-root';
	fields: Record<string, JazzParityFieldSpec>;
	orderingKeys?: readonly string[];
	parentContext?: {
		rule: 'exactly-one';
		keys: readonly [string, string];
	};
}

export interface NullableRelationshipSpec {
	entity: ConvexEntityTable;
	field: string;
	relationEntity: ConvexEntityTable;
	allowedWhen: string;
}

export const USER_SPACE_PERMISSION_POLICY = {
	rootContainer: 'UserSpace',
	ownership: 'single-account-private-data',
	defaultInlineCreate: 'extendsContainer',
	note: 'All migration entities live under one user-owned container per account.'
} as const;

export const JAZZ_SCHEMA_PARITY_SCAFFOLD: Record<ConvexEntityTable, JazzParityEntitySpec> = {
	weightConverter: {
		entity: 'weightConverter',
		ownerContainer: 'user-space-root',
		fields: {
			unit: { type: 'enum', enumValues: WEIGHT_UNITS },
			round: { type: 'boolean' },
			updatedAt: { type: 'number' }
		}
	},
	coefficientCalculator: {
		entity: 'coefficientCalculator',
		ownerContainer: 'user-space-root',
		fields: {
			genderClass: { type: 'enum', enumValues: GENDER_CLASSES },
			totalUnit: { type: 'enum', enumValues: WEIGHT_UNITS },
			bodyweightUnit: { type: 'enum', enumValues: WEIGHT_UNITS },
			updatedAt: { type: 'number' }
		}
	},
	loadPercentageCalculator: {
		entity: 'loadPercentageCalculator',
		ownerContainer: 'user-space-root',
		fields: {
			unit: { type: 'enum', enumValues: WEIGHT_UNITS },
			round: { type: 'boolean' },
			updatedAt: { type: 'number' }
		}
	},
	plateCalculator: {
		entity: 'plateCalculator',
		ownerContainer: 'user-space-root',
		fields: {
			barWeight: { type: 'number' },
			heavyCollars: { type: 'boolean' },
			allowNonStandardConfig: { type: 'boolean' },
			updatedAt: { type: 'number' }
		}
	},
	exercises: {
		entity: 'exercises',
		ownerContainer: 'user-space-root',
		fields: {
			name: { type: 'string' },
			executionType: { type: 'enum', enumValues: EXERCISE_EXECUTION_TYPES },
			loadType: { type: 'enum', enumValues: EXERCISE_LOAD_TYPES },
			muscleGroups: { type: 'string[]' },
			updatedAt: { type: 'number' }
		}
	},
	workouts: {
		entity: 'workouts',
		ownerContainer: 'user-space-root',
		fields: {
			title: { type: 'string' },
			date: { type: 'number' },
			notes: { type: 'string', optional: true },
			bodyweight: { type: 'number', optional: true },
			bodyweightUnit: { type: 'enum', enumValues: WEIGHT_UNITS, optional: true },
			programRunId: { type: 'relation', relationEntity: 'programRuns', optional: true },
			programRunSessionId: {
				type: 'relation',
				relationEntity: 'programRunSessions',
				optional: true
			},
			sourceProgramWorkoutId: {
				type: 'relation',
				relationEntity: 'programWorkouts',
				optional: true
			},
			updatedAt: { type: 'number' }
		}
	},
	performanceGroups: {
		entity: 'performanceGroups',
		ownerContainer: 'user-space-root',
		fields: {
			workoutId: { type: 'relation', relationEntity: 'workouts', optional: true },
			programWorkoutId: { type: 'relation', relationEntity: 'programWorkouts', optional: true },
			label: { type: 'string', optional: true },
			workoutOrder: { type: 'number' },
			updatedAt: { type: 'number' }
		},
		orderingKeys: ['workoutOrder'],
		parentContext: {
			rule: 'exactly-one',
			keys: ['workoutId', 'programWorkoutId']
		}
	},
	performances: {
		entity: 'performances',
		ownerContainer: 'user-space-root',
		fields: {
			performanceGroupId: { type: 'relation', relationEntity: 'performanceGroups' },
			exerciseId: { type: 'relation', relationEntity: 'exercises' },
			workoutId: { type: 'relation', relationEntity: 'workouts', optional: true },
			programWorkoutId: { type: 'relation', relationEntity: 'programWorkouts', optional: true },
			groupOrder: { type: 'number' },
			note: { type: 'string', optional: true },
			programTargets: {
				type: 'object[]',
				optional: true,
				description:
					'Array of target objects: { targetSetRange, targetRepsRange?, targetDuration? }'
			},
			weightUnit: { type: 'enum', enumValues: WEIGHT_UNITS },
			updatedAt: { type: 'number' }
		},
		orderingKeys: ['groupOrder'],
		parentContext: {
			rule: 'exactly-one',
			keys: ['workoutId', 'programWorkoutId']
		}
	},
	performanceSets: {
		entity: 'performanceSets',
		ownerContainer: 'user-space-root',
		fields: {
			performanceId: { type: 'relation', relationEntity: 'performances' },
			weight: { type: 'number', optional: true },
			reps: { type: 'number', optional: true },
			durationSeconds: { type: 'number', optional: true },
			note: { type: 'string', optional: true },
			performanceOrder: { type: 'number' },
			updatedAt: { type: 'number' }
		},
		orderingKeys: ['performanceOrder']
	},
	programWorkoutExerciseTargets: {
		entity: 'programWorkoutExerciseTargets',
		ownerContainer: 'user-space-root',
		fields: {
			programWorkoutExerciseId: { type: 'relation', relationEntity: 'performances' },
			targetSetRange: { type: 'string' },
			targetRepsRange: { type: 'string', optional: true },
			targetDuration: { type: 'string', optional: true },
			targetOrder: { type: 'number' },
			updatedAt: { type: 'number' }
		},
		orderingKeys: ['targetOrder']
	},
	programTemplates: {
		entity: 'programTemplates',
		ownerContainer: 'user-space-root',
		fields: {
			name: { type: 'string' },
			notes: { type: 'string', optional: true },
			totalWeeks: { type: 'number' },
			status: { type: 'enum', enumValues: PROGRAM_TEMPLATE_STATUSES },
			updatedAt: { type: 'number' }
		}
	},
	programWorkouts: {
		entity: 'programWorkouts',
		ownerContainer: 'user-space-root',
		fields: {
			programTemplateId: { type: 'relation', relationEntity: 'programTemplates' },
			weekNumber: { type: 'number' },
			slotOrder: { type: 'number' },
			trackKey: { type: 'string' },
			label: { type: 'string', optional: true },
			notes: { type: 'string', optional: true },
			updatedAt: { type: 'number' }
		},
		orderingKeys: ['weekNumber', 'slotOrder']
	},
	programRuns: {
		entity: 'programRuns',
		ownerContainer: 'user-space-root',
		fields: {
			programTemplateId: { type: 'relation', relationEntity: 'programTemplates' },
			status: { type: 'enum', enumValues: PROGRAM_RUN_STATUSES },
			startedAt: { type: 'number' },
			endedAt: { type: 'number', optional: true },
			updatedAt: { type: 'number' }
		}
	},
	programRunSessions: {
		entity: 'programRunSessions',
		ownerContainer: 'user-space-root',
		fields: {
			programRunId: { type: 'relation', relationEntity: 'programRuns' },
			programWorkoutId: { type: 'relation', relationEntity: 'programWorkouts' },
			workoutId: { type: 'relation', relationEntity: 'workouts', optional: true },
			skippedAt: { type: 'number', optional: true },
			updatedAt: { type: 'number' }
		}
	}
};

export const ORDERING_CONSTRAINTS: Array<{
	entity: ConvexEntityTable;
	fields: readonly string[];
	notes: string;
}> = [
	{
		entity: 'programWorkouts',
		fields: ['weekNumber', 'slotOrder'],
		notes: 'Preserve template week + slot ordering for planner and session generation.'
	},
	{
		entity: 'performanceGroups',
		fields: ['workoutOrder'],
		notes: 'Preserve group ordering inside workout/program workout contexts.'
	},
	{
		entity: 'performances',
		fields: ['groupOrder'],
		notes: 'Preserve exercise ordering inside each group.'
	},
	{
		entity: 'performanceSets',
		fields: ['performanceOrder'],
		notes: 'Preserve set ordering inside each performance.'
	},
	{
		entity: 'programWorkoutExerciseTargets',
		fields: ['targetOrder'],
		notes: 'Preserve target ordering inside each program workout exercise.'
	}
];

export const NULLABLE_RELATIONSHIPS: NullableRelationshipSpec[] = [
	{
		entity: 'workouts',
		field: 'programRunId',
		relationEntity: 'programRuns',
		allowedWhen: 'Workout is not linked to a program run.'
	},
	{
		entity: 'workouts',
		field: 'programRunSessionId',
		relationEntity: 'programRunSessions',
		allowedWhen: 'Workout was created outside program-run session flow.'
	},
	{
		entity: 'workouts',
		field: 'sourceProgramWorkoutId',
		relationEntity: 'programWorkouts',
		allowedWhen: 'Workout was created ad-hoc and not from a template workout.'
	},
	{
		entity: 'performanceGroups',
		field: 'workoutId',
		relationEntity: 'workouts',
		allowedWhen: 'Group belongs to a template workout context instead.'
	},
	{
		entity: 'performanceGroups',
		field: 'programWorkoutId',
		relationEntity: 'programWorkouts',
		allowedWhen: 'Group belongs to a real workout context instead.'
	},
	{
		entity: 'performances',
		field: 'workoutId',
		relationEntity: 'workouts',
		allowedWhen: 'Performance belongs to a program workout context instead.'
	},
	{
		entity: 'performances',
		field: 'programWorkoutId',
		relationEntity: 'programWorkouts',
		allowedWhen: 'Performance belongs to a real workout context instead.'
	},
	{
		entity: 'programRunSessions',
		field: 'workoutId',
		relationEntity: 'workouts',
		allowedWhen: 'Session has not been completed into a workout yet or was skipped.'
	}
];

export const ALLOWED_PARENT_CONTEXTS: Array<{
	entity: 'performanceGroups' | 'performances';
	rule: 'exactly-one';
	keys: readonly [string, string];
}> = [
	{
		entity: 'performanceGroups',
		rule: 'exactly-one',
		keys: ['workoutId', 'programWorkoutId']
	},
	{
		entity: 'performances',
		rule: 'exactly-one',
		keys: ['workoutId', 'programWorkoutId']
	}
];

export const ENTITY_PARITY_CHECKLIST = CONVEX_ENTITY_TABLES;
