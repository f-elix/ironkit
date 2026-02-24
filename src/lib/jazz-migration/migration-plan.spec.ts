import { describe, expect, it } from 'vitest';
import { CONVEX_ENTITY_TABLES, type SnapshotRowsByTable } from './preflight-guardrails';
import { createConvexToJazzMigrationPlanArtifacts } from './migration-plan';
import { createDeterministicConvexSnapshotExport } from './snapshot-utils';

const buildRowsByTable = (overrides: Partial<SnapshotRowsByTable> = {}): SnapshotRowsByTable => {
	const rowsByTable = CONVEX_ENTITY_TABLES.reduce<SnapshotRowsByTable>((acc, table) => {
		acc[table] = [];
		return acc;
	}, {});

	for (const [key, value] of Object.entries(overrides)) {
		rowsByTable[key] = value;
	}

	return rowsByTable;
};

describe('createDeterministicConvexSnapshotExport', () => {
	it('sorts rows deterministically independent of source order', () => {
		const rowsA = buildRowsByTable({
			exercises: [
				{
					_id: 'exercise-2',
					userId: 'user-dev',
					name: 'Bench Press',
					executionType: 'reps',
					loadType: 'weighted',
					muscleGroups: ['chest'],
					updatedAt: 2
				},
				{
					_id: 'exercise-1',
					userId: 'user-dev',
					name: 'Back Squat',
					executionType: 'reps',
					loadType: 'weighted',
					muscleGroups: ['legs'],
					updatedAt: 1
				}
			]
		});

		const rowsB = buildRowsByTable({
			exercises: [...(rowsA.exercises as unknown[])].reverse()
		});

		const exportA = createDeterministicConvexSnapshotExport({
			rowsByTable: rowsA,
			exportedAt: '2026-02-24T12:00:00.000Z'
		});
		const exportB = createDeterministicConvexSnapshotExport({
			rowsByTable: rowsB,
			exportedAt: '2026-02-24T12:00:00.000Z'
		});

		expect(exportA.tables.exercises).toEqual(exportB.tables.exercises);
	});
});

describe('createConvexToJazzMigrationPlanArtifacts', () => {
	it('builds deterministic source-to-planned-jazz ID mappings', () => {
		const artifacts = createConvexToJazzMigrationPlanArtifacts({
			account: 'dev',
			sourceUserId: 'user-dev',
			targetAccountId: 'acc_dev',
			generatedAt: '2026-02-24T12:00:00.000Z',
			rowsByTable: buildRowsByTable({
				exercises: [
					{
						_id: 'exercise-9',
						userId: 'user-dev',
						name: 'Row',
						executionType: 'reps',
						loadType: 'weighted',
						muscleGroups: ['back'],
						updatedAt: 10
					},
					{
						_id: 'exercise-3',
						userId: 'user-dev',
						name: 'Squat',
						executionType: 'reps',
						loadType: 'weighted',
						muscleGroups: ['legs'],
						updatedAt: 5
					}
				]
			})
		});

		expect(artifacts.idMappingPlan.exercises.mappings).toEqual([
			{
				sourceId: 'exercise-3',
				plannedJazzId: 'planned:acc_dev:exercises:000000'
			},
			{
				sourceId: 'exercise-9',
				plannedJazzId: 'planned:acc_dev:exercises:000001'
			}
		]);
		expect(artifacts.migrationPlan.readiness.ok).toBe(true);
	});

	it('flags ownership mismatches as readiness blockers', () => {
		const artifacts = createConvexToJazzMigrationPlanArtifacts({
			account: 'dev',
			sourceUserId: 'user-dev',
			targetAccountId: 'acc_dev',
			rowsByTable: buildRowsByTable({
				workouts: [
					{
						_id: 'workout-1',
						userId: 'someone-else',
						title: 'W1',
						date: 1700000000,
						updatedAt: 1700000000
					}
				]
			})
		});

		expect(artifacts.migrationPlan.userOwnershipCheck.ok).toBe(false);
		expect(artifacts.migrationPlan.readiness.ok).toBe(false);
		expect(artifacts.migrationPlan.readiness.blockers.some((value) => value.includes('different user'))).toBe(
			true
		);
	});
});
