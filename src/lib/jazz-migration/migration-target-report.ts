import {
	countsFromSnapshotRows,
	type PreflightRunInput,
	type SmokeCheckResult,
	type SnapshotRowsByTable
} from './preflight-guardrails';
import {
	toJazzMigrationEntityRows,
	validateSchemaParityInvariants,
	validateSchemaParityReferentialIntegrity,
	type JazzMigrationEntityRows
} from './schema-parity-scaffold';

export type MigrationTargetReport = Pick<
	PreflightRunInput,
	'targetCounts' | 'referentialChecks' | 'invariantChecks' | 'smokeChecks'
>;

export const createMigrationTargetReportFromEntityRows = (input: {
	entityRows: JazzMigrationEntityRows;
	smokeChecks?: SmokeCheckResult[];
}): MigrationTargetReport => {
	const rowsByTable: SnapshotRowsByTable = {
		weightConverter: input.entityRows.weightConverter,
		coefficientCalculator: input.entityRows.coefficientCalculator,
		loadPercentageCalculator: input.entityRows.loadPercentageCalculator,
		plateCalculator: input.entityRows.plateCalculator,
		exercises: input.entityRows.exercises,
		workouts: input.entityRows.workouts,
		performanceGroups: input.entityRows.performanceGroups,
		performances: input.entityRows.performances,
		performanceSets: input.entityRows.performanceSets,
		programWorkoutExerciseTargets: input.entityRows.programWorkoutExerciseTargets,
		programTemplates: input.entityRows.programTemplates,
		programWorkouts: input.entityRows.programWorkouts,
		programRuns: input.entityRows.programRuns,
		programRunSessions: input.entityRows.programRunSessions
	};

	return {
		targetCounts: countsFromSnapshotRows(rowsByTable),
		referentialChecks: validateSchemaParityReferentialIntegrity(input.entityRows),
		invariantChecks: validateSchemaParityInvariants(input.entityRows),
		smokeChecks: input.smokeChecks ?? []
	};
};

export const createMigrationTargetReportFromSnapshotRows = (input: {
	rowsByTable: SnapshotRowsByTable;
	smokeChecks?: SmokeCheckResult[];
}): MigrationTargetReport => {
	const entityRows = toJazzMigrationEntityRows(input.rowsByTable);
	return createMigrationTargetReportFromEntityRows({
		entityRows,
		smokeChecks: input.smokeChecks
	});
};
