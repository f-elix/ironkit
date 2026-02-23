import {
	CONVEX_ENTITY_TABLES,
	type ConvexEntityTable,
	type InvariantCheckResult,
	type ReferentialCheckResult,
	type SnapshotRowsByTable
} from './preflight-guardrails';
import {
	EXERCISE_EXECUTION_TYPES,
	EXERCISE_LOAD_TYPES,
	GENDER_CLASSES,
	JAZZ_ENTITY_SCHEMAS as RUNTIME_JAZZ_ENTITY_SCHEMAS,
	PROGRAM_RUN_STATUSES,
	PROGRAM_TEMPLATE_STATUSES,
	WEIGHT_UNITS,
	type ExerciseExecutionType,
	type ExerciseLoadType,
	type GenderClass,
	type ProgramTargetSnapshot,
	type ProgramRunStatus,
	type ProgramTemplateStatus,
	type WeightUnit
} from '../jazz/schema';

export {
	EXERCISE_EXECUTION_TYPES,
	EXERCISE_LOAD_TYPES,
	GENDER_CLASSES,
	PROGRAM_RUN_STATUSES,
	PROGRAM_TEMPLATE_STATUSES,
	WEIGHT_UNITS
};
export type {
	ExerciseExecutionType,
	ExerciseLoadType,
	GenderClass,
	ProgramRunStatus,
	ProgramTemplateStatus,
	WeightUnit
};

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

interface BaseMigrationRow {
	id?: string;
	_id?: string;
	updatedAt: number;
}

export interface WeightConverterRow extends BaseMigrationRow {
	unit: WeightUnit;
	round: boolean;
}

export interface CoefficientCalculatorRow extends BaseMigrationRow {
	genderClass: GenderClass;
	totalUnit: WeightUnit;
	bodyweightUnit: WeightUnit;
}

export interface LoadPercentageCalculatorRow extends BaseMigrationRow {
	unit: WeightUnit;
	round: boolean;
}

export interface PlateCalculatorRow extends BaseMigrationRow {
	barWeight: number;
	heavyCollars: boolean;
	allowNonStandardConfig: boolean;
}

export interface ExerciseRow extends BaseMigrationRow {
	name: string;
	executionType: ExerciseExecutionType;
	loadType: ExerciseLoadType;
	muscleGroups: string[];
}

export interface WorkoutRow extends BaseMigrationRow {
	title: string;
	date: number;
	notes?: string;
	bodyweight?: number;
	bodyweightUnit?: WeightUnit;
	programRunId?: string;
	programRunSessionId?: string;
	sourceProgramWorkoutId?: string;
}

export interface PerformanceGroupRow extends BaseMigrationRow {
	workoutId?: string;
	programWorkoutId?: string;
	label?: string;
	workoutOrder: number;
}

export interface PerformanceRow extends BaseMigrationRow {
	performanceGroupId: string;
	exerciseId: string;
	workoutId?: string;
	programWorkoutId?: string;
	groupOrder: number;
	note?: string;
	programTargets?: ProgramTargetSnapshot[];
	weightUnit: WeightUnit;
}

export interface PerformanceSetRow extends BaseMigrationRow {
	performanceId: string;
	weight?: number;
	reps?: number;
	durationSeconds?: number;
	note?: string;
	performanceOrder: number;
}

export interface ProgramWorkoutExerciseTargetRow extends BaseMigrationRow {
	programWorkoutExerciseId: string;
	targetSetRange: string;
	targetRepsRange?: string;
	targetDuration?: string;
	targetOrder: number;
}

export interface ProgramTemplateRow extends BaseMigrationRow {
	name: string;
	notes?: string;
	totalWeeks: number;
	status: ProgramTemplateStatus;
}

export interface ProgramWorkoutRow extends BaseMigrationRow {
	programTemplateId: string;
	weekNumber: number;
	slotOrder: number;
	trackKey: string;
	label?: string;
	notes?: string;
}

export interface ProgramRunRow extends BaseMigrationRow {
	programTemplateId: string;
	status: ProgramRunStatus;
	startedAt: number;
	endedAt?: number;
}

export interface ProgramRunSessionRow extends BaseMigrationRow {
	programRunId: string;
	programWorkoutId: string;
	workoutId?: string;
	skippedAt?: number;
}

export interface JazzMigrationEntityRows {
	weightConverter: WeightConverterRow[];
	coefficientCalculator: CoefficientCalculatorRow[];
	loadPercentageCalculator: LoadPercentageCalculatorRow[];
	plateCalculator: PlateCalculatorRow[];
	exercises: ExerciseRow[];
	workouts: WorkoutRow[];
	performanceGroups: PerformanceGroupRow[];
	performances: PerformanceRow[];
	performanceSets: PerformanceSetRow[];
	programWorkoutExerciseTargets: ProgramWorkoutExerciseTargetRow[];
	programTemplates: ProgramTemplateRow[];
	programWorkouts: ProgramWorkoutRow[];
	programRuns: ProgramRunRow[];
	programRunSessions: ProgramRunSessionRow[];
}

const tableRows = <Row>(rowsByTable: SnapshotRowsByTable, table: ConvexEntityTable): Row[] => {
	const rows = rowsByTable[table];
	return Array.isArray(rows) ? (rows as Row[]) : [];
};

export const toJazzMigrationEntityRows = (
	rowsByTable: SnapshotRowsByTable
): JazzMigrationEntityRows => {
	return {
		weightConverter: tableRows<WeightConverterRow>(rowsByTable, 'weightConverter'),
		coefficientCalculator: tableRows<CoefficientCalculatorRow>(rowsByTable, 'coefficientCalculator'),
		loadPercentageCalculator: tableRows<LoadPercentageCalculatorRow>(
			rowsByTable,
			'loadPercentageCalculator'
		),
		plateCalculator: tableRows<PlateCalculatorRow>(rowsByTable, 'plateCalculator'),
		exercises: tableRows<ExerciseRow>(rowsByTable, 'exercises'),
		workouts: tableRows<WorkoutRow>(rowsByTable, 'workouts'),
		performanceGroups: tableRows<PerformanceGroupRow>(rowsByTable, 'performanceGroups'),
		performances: tableRows<PerformanceRow>(rowsByTable, 'performances'),
		performanceSets: tableRows<PerformanceSetRow>(rowsByTable, 'performanceSets'),
		programWorkoutExerciseTargets: tableRows<ProgramWorkoutExerciseTargetRow>(
			rowsByTable,
			'programWorkoutExerciseTargets'
		),
		programTemplates: tableRows<ProgramTemplateRow>(rowsByTable, 'programTemplates'),
		programWorkouts: tableRows<ProgramWorkoutRow>(rowsByTable, 'programWorkouts'),
		programRuns: tableRows<ProgramRunRow>(rowsByTable, 'programRuns'),
		programRunSessions: tableRows<ProgramRunSessionRow>(rowsByTable, 'programRunSessions')
	};
};

const compareKeySets = (input: {
	leftName: string;
	leftKeys: readonly string[];
	rightName: string;
	rightKeys: readonly string[];
	violations: string[];
}) => {
	const leftSet = new Set(input.leftKeys);
	const rightSet = new Set(input.rightKeys);

	for (const key of leftSet) {
		if (!rightSet.has(key)) {
			input.violations.push(`${input.rightName} is missing ${key} from ${input.leftName}.`);
		}
	}

	for (const key of rightSet) {
		if (!leftSet.has(key)) {
			input.violations.push(
				`${input.rightName} includes extra key ${key} not present in ${input.leftName}.`
			);
		}
	}
};

const keysEqualInOrder = (left: readonly string[], right: readonly string[]) => {
	return left.length === right.length && left.every((value, index) => value === right[index]);
};

export const validateSchemaParityRuntimeAlignment = (): InvariantCheckResult => {
	const violations: string[] = [];
	const runtimeSchemaTables = Object.keys(RUNTIME_JAZZ_ENTITY_SCHEMAS);
	const parityScaffoldTables = Object.keys(JAZZ_SCHEMA_PARITY_SCAFFOLD);

	compareKeySets({
		leftName: 'CONVEX_ENTITY_TABLES',
		leftKeys: CONVEX_ENTITY_TABLES,
		rightName: 'runtime JAZZ_ENTITY_SCHEMAS',
		rightKeys: runtimeSchemaTables,
		violations
	});
	compareKeySets({
		leftName: 'runtime JAZZ_ENTITY_SCHEMAS',
		leftKeys: runtimeSchemaTables,
		rightName: 'JAZZ_SCHEMA_PARITY_SCAFFOLD',
		rightKeys: parityScaffoldTables,
		violations
	});

	const orderingByEntity = new Map(
		ORDERING_CONSTRAINTS.map((constraint) => [constraint.entity, constraint.fields] as const)
	);

	for (const entity of CONVEX_ENTITY_TABLES) {
		const spec = JAZZ_SCHEMA_PARITY_SCAFFOLD[entity];
		const documentedOrdering = orderingByEntity.get(entity);
		if (spec.orderingKeys && !documentedOrdering) {
			violations.push(
				`JAZZ_SCHEMA_PARITY_SCAFFOLD.${entity}.orderingKeys exists but ORDERING_CONSTRAINTS has no matching entry.`
			);
			continue;
		}
		if (!spec.orderingKeys && documentedOrdering) {
			violations.push(
				`ORDERING_CONSTRAINTS has ${entity}, but JAZZ_SCHEMA_PARITY_SCAFFOLD.${entity}.orderingKeys is missing.`
			);
			continue;
		}
		if (spec.orderingKeys && documentedOrdering) {
			if (!keysEqualInOrder(spec.orderingKeys, documentedOrdering)) {
				violations.push(
					`Ordering mismatch for ${entity}; scaffold=${spec.orderingKeys.join(',')} docs=${documentedOrdering.join(',')}.`
				);
			}
		}
	}

	for (const parentContext of ALLOWED_PARENT_CONTEXTS) {
		const spec = JAZZ_SCHEMA_PARITY_SCAFFOLD[parentContext.entity];
		if (!spec.parentContext) {
			violations.push(
				`ALLOWED_PARENT_CONTEXTS includes ${parentContext.entity}, but scaffold parentContext is missing.`
			);
			continue;
		}
		if (
			spec.parentContext.rule !== parentContext.rule ||
			!keysEqualInOrder(spec.parentContext.keys, parentContext.keys)
		) {
			violations.push(
				`Parent-context mismatch for ${parentContext.entity}; scaffold=${spec.parentContext.keys.join(',')} docs=${parentContext.keys.join(',')}.`
			);
		}
	}

	for (const entity of ['performanceGroups', 'performances'] as const) {
		const specParentContext = JAZZ_SCHEMA_PARITY_SCAFFOLD[entity].parentContext;
		if (!specParentContext) {
			continue;
		}
		const documentedParentContext = ALLOWED_PARENT_CONTEXTS.find((context) => context.entity === entity);
		if (!documentedParentContext) {
			violations.push(
				`JAZZ_SCHEMA_PARITY_SCAFFOLD.${entity}.parentContext exists, but ALLOWED_PARENT_CONTEXTS has no matching entry.`
			);
		}
	}

	return {
		ok: violations.length === 0,
		violations
	};
};

const asReferenceId = (value: unknown): string | null => {
	return typeof value === 'string' && value.length > 0 ? value : null;
};

const getRowIdentifier = (entity: ConvexEntityTable, row: BaseMigrationRow, index: number): string => {
	if (typeof row.id === 'string' && row.id.length > 0) {
		return `${entity}:${row.id}`;
	}
	if (typeof row._id === 'string' && row._id.length > 0) {
		return `${entity}:${row._id}`;
	}
	return `${entity}:row-${index}`;
};

const indexRowsById = <Row extends BaseMigrationRow>(rows: Row[]) => {
	const byId = new Map<string, Row>();
	for (const row of rows) {
		const id = asReferenceId(row.id) ?? asReferenceId(row._id);
		if (!id) {
			continue;
		}
		byId.set(id, row);
	}
	return byId;
};

const validateOrderField = (
	entity: ConvexEntityTable,
	row: BaseMigrationRow,
	index: number,
	field: string,
	value: number,
	violations: string[]
) => {
	if (!Number.isInteger(value) || value < 0) {
		violations.push(
			`${getRowIdentifier(entity, row, index)} has invalid ${field}; expected non-negative integer.`
		);
	}
};

const validateUniqueByContext = (
	entity: ConvexEntityTable,
	row: BaseMigrationRow,
	index: number,
	contextKey: string,
	orderField: string,
	orderValue: number,
	seenByContext: Map<string, Set<number>>,
	violations: string[]
) => {
	const seen = seenByContext.get(contextKey) ?? new Set<number>();
	if (seen.has(orderValue)) {
		violations.push(
			`${getRowIdentifier(entity, row, index)} duplicates ${orderField}=${orderValue} in context ${contextKey}.`
		);
	}
	seen.add(orderValue);
	seenByContext.set(contextKey, seen);
};

export const validateSchemaParityReferentialIntegrity = (
	rowsByEntity: JazzMigrationEntityRows
): ReferentialCheckResult => {
	const violations: string[] = [];
	const programRunsById = indexRowsById(rowsByEntity.programRuns);
	const programRunSessionsById = indexRowsById(rowsByEntity.programRunSessions);
	const programWorkoutsById = indexRowsById(rowsByEntity.programWorkouts);
	const workoutsById = indexRowsById(rowsByEntity.workouts);
	const performanceGroupsById = indexRowsById(rowsByEntity.performanceGroups);
	const exercisesById = indexRowsById(rowsByEntity.exercises);
	const performancesById = indexRowsById(rowsByEntity.performances);
	const programTemplatesById = indexRowsById(rowsByEntity.programTemplates);

	for (const [index, row] of rowsByEntity.workouts.entries()) {
		const programRunId = asReferenceId(row.programRunId);
		const programRunSessionId = asReferenceId(row.programRunSessionId);
		const sourceProgramWorkoutId = asReferenceId(row.sourceProgramWorkoutId);

		if (programRunId && !programRunsById.has(programRunId)) {
			violations.push(
				`${getRowIdentifier('workouts', row, index)} references missing programRunId=${programRunId}.`
			);
		}
		if (programRunSessionId && !programRunSessionsById.has(programRunSessionId)) {
			violations.push(
				`${getRowIdentifier('workouts', row, index)} references missing programRunSessionId=${programRunSessionId}.`
			);
		}
		if (sourceProgramWorkoutId && !programWorkoutsById.has(sourceProgramWorkoutId)) {
			violations.push(
				`${getRowIdentifier('workouts', row, index)} references missing sourceProgramWorkoutId=${sourceProgramWorkoutId}.`
			);
		}
	}

	for (const [index, row] of rowsByEntity.performanceGroups.entries()) {
		const workoutId = asReferenceId(row.workoutId);
		const programWorkoutId = asReferenceId(row.programWorkoutId);

		if (workoutId && !workoutsById.has(workoutId)) {
			violations.push(
				`${getRowIdentifier('performanceGroups', row, index)} references missing workoutId=${workoutId}.`
			);
		}
		if (programWorkoutId && !programWorkoutsById.has(programWorkoutId)) {
			violations.push(
				`${getRowIdentifier('performanceGroups', row, index)} references missing programWorkoutId=${programWorkoutId}.`
			);
		}
	}

	for (const [index, row] of rowsByEntity.performances.entries()) {
		const performanceGroupId = asReferenceId(row.performanceGroupId);
		const exerciseId = asReferenceId(row.exerciseId);
		const workoutId = asReferenceId(row.workoutId);
		const programWorkoutId = asReferenceId(row.programWorkoutId);

		if (!performanceGroupId || !performanceGroupsById.has(performanceGroupId)) {
			violations.push(
				`${getRowIdentifier('performances', row, index)} references missing performanceGroupId=${row.performanceGroupId}.`
			);
		}
		if (!exerciseId || !exercisesById.has(exerciseId)) {
			violations.push(
				`${getRowIdentifier('performances', row, index)} references missing exerciseId=${row.exerciseId}.`
			);
		}
		if (workoutId && !workoutsById.has(workoutId)) {
			violations.push(
				`${getRowIdentifier('performances', row, index)} references missing workoutId=${workoutId}.`
			);
		}
		if (programWorkoutId && !programWorkoutsById.has(programWorkoutId)) {
			violations.push(
				`${getRowIdentifier('performances', row, index)} references missing programWorkoutId=${programWorkoutId}.`
			);
		}
	}

	for (const [index, row] of rowsByEntity.performanceSets.entries()) {
		const performanceId = asReferenceId(row.performanceId);
		if (!performanceId || !performancesById.has(performanceId)) {
			violations.push(
				`${getRowIdentifier('performanceSets', row, index)} references missing performanceId=${row.performanceId}.`
			);
		}
	}

	for (const [index, row] of rowsByEntity.programWorkoutExerciseTargets.entries()) {
		const programWorkoutExerciseId = asReferenceId(row.programWorkoutExerciseId);
		if (!programWorkoutExerciseId || !performancesById.has(programWorkoutExerciseId)) {
			violations.push(
				`${getRowIdentifier('programWorkoutExerciseTargets', row, index)} references missing programWorkoutExerciseId=${row.programWorkoutExerciseId}.`
			);
		}
	}

	for (const [index, row] of rowsByEntity.programWorkouts.entries()) {
		const programTemplateId = asReferenceId(row.programTemplateId);
		if (!programTemplateId || !programTemplatesById.has(programTemplateId)) {
			violations.push(
				`${getRowIdentifier('programWorkouts', row, index)} references missing programTemplateId=${row.programTemplateId}.`
			);
		}
	}

	for (const [index, row] of rowsByEntity.programRuns.entries()) {
		const programTemplateId = asReferenceId(row.programTemplateId);
		if (!programTemplateId || !programTemplatesById.has(programTemplateId)) {
			violations.push(
				`${getRowIdentifier('programRuns', row, index)} references missing programTemplateId=${row.programTemplateId}.`
			);
		}
	}

	for (const [index, row] of rowsByEntity.programRunSessions.entries()) {
		const programRunId = asReferenceId(row.programRunId);
		const programWorkoutId = asReferenceId(row.programWorkoutId);
		const workoutId = asReferenceId(row.workoutId);

		if (!programRunId || !programRunsById.has(programRunId)) {
			violations.push(
				`${getRowIdentifier('programRunSessions', row, index)} references missing programRunId=${row.programRunId}.`
			);
		}
		if (!programWorkoutId || !programWorkoutsById.has(programWorkoutId)) {
			violations.push(
				`${getRowIdentifier('programRunSessions', row, index)} references missing programWorkoutId=${row.programWorkoutId}.`
			);
		}
		if (workoutId && !workoutsById.has(workoutId)) {
			violations.push(
				`${getRowIdentifier('programRunSessions', row, index)} references missing workoutId=${workoutId}.`
			);
		}
	}

	return {
		ok: violations.length === 0,
		violations
	};
};

export const validateSchemaParityInvariants = (
	rowsByEntity: JazzMigrationEntityRows
): InvariantCheckResult => {
	const schemaAlignment = validateSchemaParityRuntimeAlignment();
	const violations: string[] = [...schemaAlignment.violations];

	for (const [index, row] of rowsByEntity.performanceGroups.entries()) {
		const hasWorkoutId = asReferenceId(row.workoutId) !== null;
		const hasProgramWorkoutId = asReferenceId(row.programWorkoutId) !== null;
		if (hasWorkoutId === hasProgramWorkoutId) {
			violations.push(
				`${getRowIdentifier('performanceGroups', row, index)} violates parent-context rule; exactly one of workoutId/programWorkoutId is required.`
			);
		}
	}

	for (const [index, row] of rowsByEntity.performances.entries()) {
		const hasWorkoutId = asReferenceId(row.workoutId) !== null;
		const hasProgramWorkoutId = asReferenceId(row.programWorkoutId) !== null;
		if (hasWorkoutId === hasProgramWorkoutId) {
			violations.push(
				`${getRowIdentifier('performances', row, index)} violates parent-context rule; exactly one of workoutId/programWorkoutId is required.`
			);
		}
	}

	const workoutOrderByContext = new Map<string, Set<number>>();
	for (const [index, row] of rowsByEntity.performanceGroups.entries()) {
		validateOrderField(
			'performanceGroups',
			row,
			index,
			'workoutOrder',
			row.workoutOrder,
			violations
		);
		const workoutId = asReferenceId(row.workoutId);
		const programWorkoutId = asReferenceId(row.programWorkoutId);
		if (!workoutId && !programWorkoutId) {
			continue;
		}
		const context = workoutId ? `workout:${workoutId}` : `programWorkout:${programWorkoutId}`;
		validateUniqueByContext(
			'performanceGroups',
			row,
			index,
			context,
			'workoutOrder',
			row.workoutOrder,
			workoutOrderByContext,
			violations
		);
	}

	const groupOrderByGroup = new Map<string, Set<number>>();
	for (const [index, row] of rowsByEntity.performances.entries()) {
		validateOrderField('performances', row, index, 'groupOrder', row.groupOrder, violations);
		validateUniqueByContext(
			'performances',
			row,
			index,
			`performanceGroup:${row.performanceGroupId}`,
			'groupOrder',
			row.groupOrder,
			groupOrderByGroup,
			violations
		);
	}

	const performanceOrderByPerformance = new Map<string, Set<number>>();
	for (const [index, row] of rowsByEntity.performanceSets.entries()) {
		validateOrderField(
			'performanceSets',
			row,
			index,
			'performanceOrder',
			row.performanceOrder,
			violations
		);
		validateUniqueByContext(
			'performanceSets',
			row,
			index,
			`performance:${row.performanceId}`,
			'performanceOrder',
			row.performanceOrder,
			performanceOrderByPerformance,
			violations
		);
	}

	const targetOrderByExercise = new Map<string, Set<number>>();
	for (const [index, row] of rowsByEntity.programWorkoutExerciseTargets.entries()) {
		validateOrderField(
			'programWorkoutExerciseTargets',
			row,
			index,
			'targetOrder',
			row.targetOrder,
			violations
		);
		validateUniqueByContext(
			'programWorkoutExerciseTargets',
			row,
			index,
			`programWorkoutExercise:${row.programWorkoutExerciseId}`,
			'targetOrder',
			row.targetOrder,
			targetOrderByExercise,
			violations
		);
	}

	const slotOrderByTemplateWeek = new Map<string, Set<number>>();
	for (const [index, row] of rowsByEntity.programWorkouts.entries()) {
		validateOrderField('programWorkouts', row, index, 'slotOrder', row.slotOrder, violations);
		if (!Number.isInteger(row.weekNumber) || row.weekNumber < 1) {
			violations.push(
				`${getRowIdentifier('programWorkouts', row, index)} has invalid weekNumber=${row.weekNumber}; expected positive integer.`
			);
		}
		validateUniqueByContext(
			'programWorkouts',
			row,
			index,
			`programTemplate:${row.programTemplateId}|week:${row.weekNumber}`,
			'slotOrder',
			row.slotOrder,
			slotOrderByTemplateWeek,
			violations
		);
	}

	const performanceGroupsById = indexRowsById(rowsByEntity.performanceGroups);
	for (const [index, row] of rowsByEntity.performances.entries()) {
		const group = performanceGroupsById.get(row.performanceGroupId);
		if (!group) {
			continue;
		}
		const groupWorkoutId = asReferenceId(group.workoutId);
		const groupProgramWorkoutId = asReferenceId(group.programWorkoutId);
		const rowWorkoutId = asReferenceId(row.workoutId);
		const rowProgramWorkoutId = asReferenceId(row.programWorkoutId);
		if (groupWorkoutId !== rowWorkoutId || groupProgramWorkoutId !== rowProgramWorkoutId) {
			violations.push(
				`${getRowIdentifier('performances', row, index)} parent context does not match performanceGroup ${row.performanceGroupId}.`
			);
		}
	}

	const workoutsById = indexRowsById(rowsByEntity.workouts);
	for (const [index, session] of rowsByEntity.programRunSessions.entries()) {
		const workoutId = asReferenceId(session.workoutId);
		if (!workoutId) {
			continue;
		}
		const workout = workoutsById.get(workoutId);
		if (!workout) {
			continue;
		}
		if (asReferenceId(workout.programRunId) !== asReferenceId(session.programRunId)) {
			violations.push(
				`${getRowIdentifier('programRunSessions', session, index)} has workout ${workoutId} with mismatched programRunId.`
			);
		}
		const workoutSessionId = asReferenceId(workout.programRunSessionId);
		const sessionId = asReferenceId(session.id) ?? asReferenceId(session._id);
		if (workoutSessionId && sessionId && workoutSessionId !== sessionId) {
			violations.push(
				`${getRowIdentifier('programRunSessions', session, index)} has workout ${workoutId} linked to a different session id (${workoutSessionId}).`
			);
		}
	}

	const activeRunCount = rowsByEntity.programRuns.filter((run) => run.status === 'active').length;
	if (activeRunCount > 1) {
		violations.push(`programRuns has ${activeRunCount} active runs; expected at most one.`);
	}

	const runIdOf = (row: ProgramRunRow) => asReferenceId(row.id) ?? asReferenceId(row._id);
	const sessionsByRunId = new Map<string, ProgramRunSessionRow[]>();
	for (const session of rowsByEntity.programRunSessions) {
		const runId = asReferenceId(session.programRunId);
		if (!runId) {
			continue;
		}
		const sessions = sessionsByRunId.get(runId) ?? [];
		sessions.push(session);
		sessionsByRunId.set(runId, sessions);
	}

	for (const [index, run] of rowsByEntity.programRuns.entries()) {
		const runId = runIdOf(run);
		if (!runId) {
			continue;
		}
		const runSessions = sessionsByRunId.get(runId) ?? [];
		const openSessionCount = runSessions.filter(
			(session) => asReferenceId(session.workoutId) === null && session.skippedAt === undefined
		).length;

		if (run.status === 'completed') {
			if (openSessionCount > 0) {
				violations.push(
					`${getRowIdentifier('programRuns', run, index)} is completed but has ${openSessionCount} open sessions.`
				);
			}
			if (run.endedAt === undefined) {
				violations.push(
					`${getRowIdentifier('programRuns', run, index)} is completed but endedAt is undefined.`
				);
			}
		}

		if ((run.status === 'active' || run.status === 'paused') && run.endedAt !== undefined) {
			violations.push(
				`${getRowIdentifier('programRuns', run, index)} has status ${run.status} but endedAt is set.`
			);
		}

		if (run.status === 'active' && openSessionCount === 0) {
			violations.push(
				`${getRowIdentifier('programRuns', run, index)} is active with no open sessions; expected completed status.`
			);
		}
	}

	return {
		ok: violations.length === 0,
		violations
	};
};
