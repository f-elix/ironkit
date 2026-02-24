import {
	type ConvexEntityTable,
	type InvariantCheckResult,
	type ReferentialCheckResult,
	type SnapshotRowsByTable
} from './preflight-guardrails';
import type {
	ExerciseExecutionType,
	ExerciseLoadType,
	GenderClass,
	ProgramRunStatus,
	ProgramTargetSnapshot,
	ProgramTemplateStatus,
	WeightUnit
} from '../jazz/schema';

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
	const violations: string[] = [];

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
