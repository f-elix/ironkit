import { describe, expect, it } from 'vitest';
import { JAZZ_ENTITY_SCHEMAS } from '../jazz/schema';
import {
	validateSchemaParityInvariants,
	validateSchemaParityReferentialIntegrity,
	validateSchemaParityRuntimeAlignment,
	type JazzMigrationEntityRows
} from './schema-parity-scaffold';
import { createMigrationTargetReportFromSnapshotRows } from './migration-target-report';
import { CONVEX_ENTITY_TABLES, type ConvexEntityTable, type SnapshotRowsByTable } from './preflight-guardrails';

const buildRealisticEntityRows = (): JazzMigrationEntityRows => ({
	weightConverter: [{ _id: 'wc-1', unit: 'kg', round: true, updatedAt: 1700000000001 }],
	coefficientCalculator: [
		{
			_id: 'cc-1',
			genderClass: 'male',
			totalUnit: 'kg',
			bodyweightUnit: 'kg',
			updatedAt: 1700000000002
		}
	],
	loadPercentageCalculator: [
		{ _id: 'lpc-1', unit: 'kg', round: false, updatedAt: 1700000000003 }
	],
	plateCalculator: [
		{
			_id: 'pc-1',
			barWeight: 20,
			heavyCollars: false,
			allowNonStandardConfig: false,
			updatedAt: 1700000000004
		}
	],
	exercises: [
		{
			_id: 'ex-1',
			name: 'Back Squat',
			executionType: 'reps',
			loadType: 'weighted',
			muscleGroups: ['quadriceps', 'glutes'],
			updatedAt: 1700000000010
		},
		{
			_id: 'ex-2',
			name: 'Plank',
			executionType: 'time',
			loadType: 'bodyweight',
			muscleGroups: ['core'],
			updatedAt: 1700000000011
		}
	],
	workouts: [
		{
			_id: 'w-1',
			title: 'Week 1 Day 1',
			date: 1700000001000,
			programRunId: 'pr-1',
			programRunSessionId: 'prs-1',
			sourceProgramWorkoutId: 'pw-1',
			updatedAt: 1700000000012
		},
		{
			_id: 'w-2',
			title: 'Ad hoc workout',
			date: 1700000002000,
			updatedAt: 1700000000013
		}
	],
	performanceGroups: [
		{
			_id: 'pg-1',
			workoutId: 'w-1',
			workoutOrder: 0,
			updatedAt: 1700000000014
		},
		{
			_id: 'pg-2',
			programWorkoutId: 'pw-2',
			workoutOrder: 0,
			updatedAt: 1700000000015
		}
	],
	performances: [
		{
			_id: 'p-1',
			performanceGroupId: 'pg-1',
			exerciseId: 'ex-1',
			workoutId: 'w-1',
			groupOrder: 0,
			weightUnit: 'kg',
			updatedAt: 1700000000016
		},
		{
			_id: 'p-2',
			performanceGroupId: 'pg-1',
			exerciseId: 'ex-2',
			workoutId: 'w-1',
			groupOrder: 1,
			weightUnit: 'kg',
			updatedAt: 1700000000017
		},
		{
			_id: 'p-3',
			performanceGroupId: 'pg-2',
			exerciseId: 'ex-1',
			programWorkoutId: 'pw-2',
			groupOrder: 0,
			weightUnit: 'kg',
			updatedAt: 1700000000018
		}
	],
	performanceSets: [
		{
			_id: 'ps-1',
			performanceId: 'p-1',
			reps: 5,
			performanceOrder: 0,
			updatedAt: 1700000000019
		},
		{
			_id: 'ps-2',
			performanceId: 'p-1',
			reps: 5,
			performanceOrder: 1,
			updatedAt: 1700000000020
		},
		{
			_id: 'ps-3',
			performanceId: 'p-2',
			durationSeconds: 45,
			performanceOrder: 0,
			updatedAt: 1700000000021
		}
	],
	programWorkoutExerciseTargets: [
		{
			_id: 't-1',
			programWorkoutExerciseId: 'p-3',
			targetSetRange: '3',
			targetRepsRange: '5',
			targetOrder: 0,
			updatedAt: 1700000000022
		},
		{
			_id: 't-2',
			programWorkoutExerciseId: 'p-3',
			targetSetRange: '2',
			targetDuration: '00:30',
			targetOrder: 1,
			updatedAt: 1700000000023
		}
	],
	programTemplates: [
		{
			_id: 'pt-1',
			name: 'Strength Block',
			totalWeeks: 4,
			status: 'published',
			updatedAt: 1700000000024
		}
	],
	programWorkouts: [
		{
			_id: 'pw-1',
			programTemplateId: 'pt-1',
			weekNumber: 1,
			slotOrder: 0,
			trackKey: 'main',
			updatedAt: 1700000000025
		},
		{
			_id: 'pw-2',
			programTemplateId: 'pt-1',
			weekNumber: 1,
			slotOrder: 1,
			trackKey: 'main',
			updatedAt: 1700000000026
		}
	],
	programRuns: [
		{
			_id: 'pr-1',
			programTemplateId: 'pt-1',
			status: 'active',
			startedAt: 1700000000500,
			updatedAt: 1700000000027
		}
	],
	programRunSessions: [
		{
			_id: 'prs-1',
			programRunId: 'pr-1',
			programWorkoutId: 'pw-1',
			workoutId: 'w-1',
			updatedAt: 1700000000028
		},
		{
			_id: 'prs-2',
			programRunId: 'pr-1',
			programWorkoutId: 'pw-2',
			updatedAt: 1700000000029
		}
	]
});

const cloneEntityRows = (entityRows: JazzMigrationEntityRows): JazzMigrationEntityRows => {
	return structuredClone(entityRows);
};

const toSnapshotRows = (entityRows: JazzMigrationEntityRows): SnapshotRowsByTable => ({
	weightConverter: entityRows.weightConverter,
	coefficientCalculator: entityRows.coefficientCalculator,
	loadPercentageCalculator: entityRows.loadPercentageCalculator,
	plateCalculator: entityRows.plateCalculator,
	exercises: entityRows.exercises,
	workouts: entityRows.workouts,
	performanceGroups: entityRows.performanceGroups,
	performances: entityRows.performances,
	performanceSets: entityRows.performanceSets,
	programWorkoutExerciseTargets: entityRows.programWorkoutExerciseTargets,
	programTemplates: entityRows.programTemplates,
	programWorkouts: entityRows.programWorkouts,
	programRuns: entityRows.programRuns,
	programRunSessions: entityRows.programRunSessions
});

const countRows = (rows: JazzMigrationEntityRows, table: ConvexEntityTable): number => {
	switch (table) {
		case 'weightConverter':
			return rows.weightConverter.length;
		case 'coefficientCalculator':
			return rows.coefficientCalculator.length;
		case 'loadPercentageCalculator':
			return rows.loadPercentageCalculator.length;
		case 'plateCalculator':
			return rows.plateCalculator.length;
		case 'exercises':
			return rows.exercises.length;
		case 'workouts':
			return rows.workouts.length;
		case 'performanceGroups':
			return rows.performanceGroups.length;
		case 'performances':
			return rows.performances.length;
		case 'performanceSets':
			return rows.performanceSets.length;
		case 'programWorkoutExerciseTargets':
			return rows.programWorkoutExerciseTargets.length;
		case 'programTemplates':
			return rows.programTemplates.length;
		case 'programWorkouts':
			return rows.programWorkouts.length;
		case 'programRuns':
			return rows.programRuns.length;
		case 'programRunSessions':
			return rows.programRunSessions.length;
	}
};

describe('schema parity runtime alignment', () => {
	it('keeps runtime schema table keys aligned with migration parity definitions', () => {
		const runtimeKeys = Object.keys(JAZZ_ENTITY_SCHEMAS).sort();
		const convexEntityTables = [...CONVEX_ENTITY_TABLES].sort();

		expect(runtimeKeys).toEqual(convexEntityTables);
		expect(validateSchemaParityRuntimeAlignment()).toEqual({ ok: true, violations: [] });
	});
});

describe('schema parity validators with realistic fixtures', () => {
	it('passes referential and invariant validation for a realistic linked dataset', () => {
		const rows = buildRealisticEntityRows();

		const referentialResult = validateSchemaParityReferentialIntegrity(rows);
		const invariantResult = validateSchemaParityInvariants(rows);

		expect(referentialResult).toEqual({ ok: true, violations: [] });
		expect(invariantResult).toEqual({ ok: true, violations: [] });
	});

	it('fails referential integrity for missing linked entities', () => {
		const rows = cloneEntityRows(buildRealisticEntityRows());
		rows.performanceSets[0].performanceId = 'missing-performance';

		const result = validateSchemaParityReferentialIntegrity(rows);

		expect(result.ok).toBe(false);
		expect(result.violations.some((violation) => violation.includes('missing performanceId'))).toBe(
			true
		);
	});

	it('fails parent-context XOR invariants for performance groups and performances', () => {
		const rows = cloneEntityRows(buildRealisticEntityRows());
		rows.performanceGroups[0].programWorkoutId = 'pw-1';
		rows.performances[0].programWorkoutId = 'pw-1';

		const result = validateSchemaParityInvariants(rows);

		expect(result.ok).toBe(false);
		expect(
			result.violations.some((violation) =>
				violation.includes('performanceGroups:pg-1 violates parent-context rule')
			)
		).toBe(true);
		expect(
			result.violations.some((violation) =>
				violation.includes('performances:p-1 violates parent-context rule')
			)
		).toBe(true);
	});

	it('fails ordering invariants across every constrained ordering key', () => {
		const rows = cloneEntityRows(buildRealisticEntityRows());
		rows.performanceGroups.push({
			_id: 'pg-3',
			workoutId: 'w-1',
			workoutOrder: 0,
			updatedAt: 1700000000030
		});
		rows.performances[1].groupOrder = 0;
		rows.performanceSets[1].performanceOrder = 0;
		rows.programWorkoutExerciseTargets[1].targetOrder = 0;
		rows.programWorkouts[1].slotOrder = 0;

		const result = validateSchemaParityInvariants(rows);

		expect(result.ok).toBe(false);
		expect(result.violations.some((violation) => violation.includes('workoutOrder'))).toBe(true);
		expect(result.violations.some((violation) => violation.includes('groupOrder'))).toBe(true);
		expect(result.violations.some((violation) => violation.includes('performanceOrder'))).toBe(true);
		expect(result.violations.some((violation) => violation.includes('targetOrder'))).toBe(true);
		expect(result.violations.some((violation) => violation.includes('slotOrder'))).toBe(true);
	});

	it('fails active-run/session invariants for active-run cardinality and run completion rules', () => {
		const rows = cloneEntityRows(buildRealisticEntityRows());
		rows.programRuns.push({
			_id: 'pr-2',
			programTemplateId: 'pt-1',
			status: 'active',
			startedAt: 1700000000600,
			updatedAt: 1700000000031
		});
		rows.programRuns[0].status = 'completed';
		rows.programRuns[0].endedAt = undefined;
		rows.programRuns[1].status = 'active';
		rows.programRuns[1].endedAt = 1700000000700;

		const result = validateSchemaParityInvariants(rows);

		expect(result.ok).toBe(false);
		expect(
			result.violations.some((violation) =>
				violation.includes('programRuns:pr-1 is completed but has 1 open sessions')
			)
		).toBe(true);
		expect(
			result.violations.some((violation) =>
				violation.includes('programRuns:pr-1 is completed but endedAt is undefined')
			)
		).toBe(true);
		expect(
			result.violations.some((violation) =>
				violation.includes('programRuns:pr-2 has status active but endedAt is set')
			)
		).toBe(true);
		expect(
			result.violations.some((violation) =>
				violation.includes('programRuns:pr-2 is active with no open sessions')
			)
		).toBe(true);
	});

	it('fails when more than one active run exists', () => {
		const rows = cloneEntityRows(buildRealisticEntityRows());
		rows.programRuns.push({
			_id: 'pr-2',
			programTemplateId: 'pt-1',
			status: 'active',
			startedAt: 1700000000800,
			updatedAt: 1700000000033
		});

		const result = validateSchemaParityInvariants(rows);

		expect(result.ok).toBe(false);
		expect(
			result.violations.some((violation) =>
				violation.includes('programRuns has 2 active runs; expected at most one')
			)
		).toBe(true);
	});

	it('fails session-workout linkage invariants when workout references a different run/session', () => {
		const rows = cloneEntityRows(buildRealisticEntityRows());
		rows.workouts[0].programRunId = 'pr-2';
		rows.workouts[0].programRunSessionId = 'prs-2';
		rows.programRuns.push({
			_id: 'pr-2',
			programTemplateId: 'pt-1',
			status: 'paused',
			startedAt: 1700000000900,
			updatedAt: 1700000000032
		});

		const result = validateSchemaParityInvariants(rows);

		expect(result.ok).toBe(false);
		expect(
			result.violations.some((violation) =>
				violation.includes('programRunSessions:prs-1 has workout w-1 with mismatched programRunId')
			)
		).toBe(true);
		expect(
			result.violations.some((violation) =>
				violation.includes('linked to a different session id')
			)
		).toBe(true);
	});
});

describe('migration target report generation', () => {
	it('builds counts and checks from realistic snapshot-shaped rows', () => {
		const entityRows = buildRealisticEntityRows();
		const report = createMigrationTargetReportFromSnapshotRows({
			rowsByTable: toSnapshotRows(entityRows)
		});

		for (const table of CONVEX_ENTITY_TABLES) {
			expect(report.targetCounts[table]).toBe(countRows(entityRows, table));
		}
		expect(report.referentialChecks).toEqual({ ok: true, violations: [] });
		expect(report.invariantChecks).toEqual({ ok: true, violations: [] });
		expect(report.smokeChecks).toEqual([]);
	});
});
