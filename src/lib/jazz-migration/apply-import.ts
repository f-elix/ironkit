import { deleteCoValues, type Account } from 'jazz-tools';
import {
	JazzUserSpace
} from '../jazz/schema';
import {
	CONVEX_ENTITY_TABLES,
	type ConvexEntityTable
} from './preflight-guardrails';
import {
	createMigrationTargetReportFromEntityRows,
	type MigrationTargetReport
} from './migration-target-report';
import {
	toJazzMigrationEntityRows,
	type JazzMigrationEntityRows
} from './schema-parity-scaffold';
import type { DeterministicConvexSnapshotExport } from './snapshot-utils';

export interface AppliedIdMappingEntry {
	sourceId: string;
	jazzId: string;
}

export interface AppliedTableIdMapping {
	mappings: AppliedIdMappingEntry[];
	missingSourceIdRows: number;
	duplicateSourceIds: string[];
}

export type AppliedIdMappingByTable = Record<ConvexEntityTable, AppliedTableIdMapping>;

export interface JazzImportApplyResult {
	targetReport: MigrationTargetReport;
	appliedIdMappingByTable: AppliedIdMappingByTable;
	rootSwitch: {
		previousRootId?: string;
		replacementRootId: string;
		deletedPreviousRoot: boolean;
	};
}

const asString = (value: unknown): string | null => {
	if (typeof value !== 'string') {
		return null;
	}
	return value.length > 0 ? value : null;
};

const getSourceId = (row: unknown): string | null => {
	if (!row || typeof row !== 'object' || Array.isArray(row)) {
		return null;
	}

	const rowRecord = row as Record<string, unknown>;
	return asString(rowRecord._id) ?? asString(rowRecord.id);
};

const emptyAppliedIdMappingByTable = (): AppliedIdMappingByTable => {
	return CONVEX_ENTITY_TABLES.reduce<AppliedIdMappingByTable>((acc, table) => {
		acc[table] = {
			mappings: [],
			missingSourceIdRows: 0,
			duplicateSourceIds: []
		};
		return acc;
	}, {} as AppliedIdMappingByTable);
};

const emptyIdLookupByTable = (): Record<ConvexEntityTable, Map<string, string>> => {
	return CONVEX_ENTITY_TABLES.reduce<Record<ConvexEntityTable, Map<string, string>>>((acc, table) => {
		acc[table] = new Map<string, string>();
		return acc;
	}, {} as Record<ConvexEntityTable, Map<string, string>>);
};

const pushToList = <TListItem, TInput>(
	list: {
		length: number;
		[index: number]: TListItem;
		$jazz: { push: (...items: TInput[]) => number };
	},
	item: TInput
): TListItem => {
	const nextLength = list.$jazz.push(item);
	return list[nextLength - 1] as TListItem;
};

const requireMappedEntity = <T>(map: Map<string, T>, sourceId: string, label: string): T => {
	const value = map.get(sourceId);
	if (!value) {
		throw new Error(`Missing mapped entity for ${label}: ${sourceId}`);
	}
	return value;
};

const mapReferenceId = (
	lookupByTable: Record<ConvexEntityTable, Map<string, string>>,
	table: ConvexEntityTable,
	sourceId: string | undefined
): string | undefined => {
	if (!sourceId) {
		return undefined;
	}

	return lookupByTable[table].get(sourceId) ?? sourceId;
};

const rowId = (
	lookupByTable: Record<ConvexEntityTable, Map<string, string>>,
	table: ConvexEntityTable,
	row: unknown,
	index: number
): string => {
	const sourceId = getSourceId(row);
	if (!sourceId) {
		return `generated:${table}:${index}`;
	}
	return lookupByTable[table].get(sourceId) ?? sourceId;
};

const buildImportedEntityRows = (
	sourceRows: JazzMigrationEntityRows,
	lookupByTable: Record<ConvexEntityTable, Map<string, string>>
): JazzMigrationEntityRows => {
	return {
		weightConverter: sourceRows.weightConverter.map((row, index) => ({
			...row,
			_id: rowId(lookupByTable, 'weightConverter', row, index)
		})),
		coefficientCalculator: sourceRows.coefficientCalculator.map((row, index) => ({
			...row,
			_id: rowId(lookupByTable, 'coefficientCalculator', row, index)
		})),
		loadPercentageCalculator: sourceRows.loadPercentageCalculator.map((row, index) => ({
			...row,
			_id: rowId(lookupByTable, 'loadPercentageCalculator', row, index)
		})),
		plateCalculator: sourceRows.plateCalculator.map((row, index) => ({
			...row,
			_id: rowId(lookupByTable, 'plateCalculator', row, index)
		})),
		exercises: sourceRows.exercises.map((row, index) => ({
			...row,
			_id: rowId(lookupByTable, 'exercises', row, index)
		})),
		workouts: sourceRows.workouts.map((row, index) => ({
			...row,
			_id: rowId(lookupByTable, 'workouts', row, index),
			programRunId: mapReferenceId(lookupByTable, 'programRuns', row.programRunId),
			programRunSessionId: mapReferenceId(
				lookupByTable,
				'programRunSessions',
				row.programRunSessionId
			),
			sourceProgramWorkoutId: mapReferenceId(
				lookupByTable,
				'programWorkouts',
				row.sourceProgramWorkoutId
			)
		})),
		performanceGroups: sourceRows.performanceGroups.map((row, index) => ({
			...row,
			_id: rowId(lookupByTable, 'performanceGroups', row, index),
			workoutId: mapReferenceId(lookupByTable, 'workouts', row.workoutId),
			programWorkoutId: mapReferenceId(lookupByTable, 'programWorkouts', row.programWorkoutId)
		})),
		performances: sourceRows.performances.map((row, index) => ({
			...row,
			_id: rowId(lookupByTable, 'performances', row, index),
			performanceGroupId: mapReferenceId(lookupByTable, 'performanceGroups', row.performanceGroupId) ?? '',
			exerciseId: mapReferenceId(lookupByTable, 'exercises', row.exerciseId) ?? '',
			workoutId: mapReferenceId(lookupByTable, 'workouts', row.workoutId),
			programWorkoutId: mapReferenceId(lookupByTable, 'programWorkouts', row.programWorkoutId)
		})),
		performanceSets: sourceRows.performanceSets.map((row, index) => ({
			...row,
			_id: rowId(lookupByTable, 'performanceSets', row, index),
			performanceId: mapReferenceId(lookupByTable, 'performances', row.performanceId) ?? ''
		})),
		programWorkoutExerciseTargets: sourceRows.programWorkoutExerciseTargets.map((row, index) => ({
			...row,
			_id: rowId(lookupByTable, 'programWorkoutExerciseTargets', row, index),
			programWorkoutExerciseId:
				mapReferenceId(lookupByTable, 'performances', row.programWorkoutExerciseId) ?? ''
		})),
		programTemplates: sourceRows.programTemplates.map((row, index) => ({
			...row,
			_id: rowId(lookupByTable, 'programTemplates', row, index)
		})),
		programWorkouts: sourceRows.programWorkouts.map((row, index) => ({
			...row,
			_id: rowId(lookupByTable, 'programWorkouts', row, index),
			programTemplateId:
				mapReferenceId(lookupByTable, 'programTemplates', row.programTemplateId) ?? ''
		})),
		programRuns: sourceRows.programRuns.map((row, index) => ({
			...row,
			_id: rowId(lookupByTable, 'programRuns', row, index),
			programTemplateId:
				mapReferenceId(lookupByTable, 'programTemplates', row.programTemplateId) ?? ''
		})),
		programRunSessions: sourceRows.programRunSessions.map((row, index) => ({
			...row,
			_id: rowId(lookupByTable, 'programRunSessions', row, index),
			programRunId: mapReferenceId(lookupByTable, 'programRuns', row.programRunId) ?? '',
			programWorkoutId:
				mapReferenceId(lookupByTable, 'programWorkouts', row.programWorkoutId) ?? '',
			workoutId: mapReferenceId(lookupByTable, 'workouts', row.workoutId)
		}))
	};
};

const recordCreatedMapping = (input: {
	table: ConvexEntityTable;
	row: unknown;
	created: { $jazz: { id: string } };
	appliedMapping: AppliedIdMappingByTable;
	lookupByTable: Record<ConvexEntityTable, Map<string, string>>;
}): string | null => {
	const sourceId = getSourceId(input.row);
	if (!sourceId) {
		input.appliedMapping[input.table].missingSourceIdRows += 1;
		return null;
	}

	const existing = input.lookupByTable[input.table].get(sourceId);
	if (existing) {
		if (!input.appliedMapping[input.table].duplicateSourceIds.includes(sourceId)) {
			input.appliedMapping[input.table].duplicateSourceIds.push(sourceId);
		}
		return existing;
	}

	const jazzId = input.created.$jazz.id;
	input.lookupByTable[input.table].set(sourceId, jazzId);
	input.appliedMapping[input.table].mappings.push({
		sourceId,
		jazzId
	});
	return sourceId;
};

export const applyDeterministicSnapshotToJazzAccount = async (input: {
	worker: Account;
	deterministicSnapshot: DeterministicConvexSnapshotExport;
}): Promise<JazzImportApplyResult> => {
	const sourceRows = toJazzMigrationEntityRows(input.deterministicSnapshot.tables);
	const appliedMapping = emptyAppliedIdMappingByTable();
	const lookupByTable = emptyIdLookupByTable();

	const previousRoot = input.worker.root as (typeof input.worker.root & { $jazz?: { id: string } }) | undefined;
	const previousRootId = previousRoot?.$jazz?.id;

	const replacementRoot = JazzUserSpace.create(
		{
			weightConverter: [],
			coefficientCalculator: [],
			loadPercentageCalculator: [],
			plateCalculator: [],
			exercises: [],
			workouts: [],
			programTemplates: [],
			programRuns: []
		},
		{ owner: input.worker }
	);

	const exercisesBySourceId = new Map<string, unknown>();
	const workoutsBySourceId = new Map<string, unknown>();
	const performanceGroupsBySourceId = new Map<string, unknown>();
	const performancesBySourceId = new Map<string, unknown>();
	const programTemplatesBySourceId = new Map<string, unknown>();
	const programWorkoutsBySourceId = new Map<string, unknown>();
	const programRunsBySourceId = new Map<string, unknown>();
	const programRunSessionsBySourceId = new Map<string, unknown>();

	for (const row of sourceRows.weightConverter) {
		const created = pushToList(replacementRoot.weightConverter, {
			unit: row.unit,
			round: row.round,
			updatedAt: row.updatedAt
		}) as { $jazz: { id: string } };
		recordCreatedMapping({
			table: 'weightConverter',
			row,
			created,
			appliedMapping,
			lookupByTable
		});
	}

	for (const row of sourceRows.coefficientCalculator) {
		const created = pushToList(replacementRoot.coefficientCalculator, {
			genderClass: row.genderClass,
			totalUnit: row.totalUnit,
			bodyweightUnit: row.bodyweightUnit,
			updatedAt: row.updatedAt
		}) as { $jazz: { id: string } };
		recordCreatedMapping({
			table: 'coefficientCalculator',
			row,
			created,
			appliedMapping,
			lookupByTable
		});
	}

	for (const row of sourceRows.loadPercentageCalculator) {
		const created = pushToList(
			replacementRoot.loadPercentageCalculator,
			{
				unit: row.unit,
				round: row.round,
				updatedAt: row.updatedAt
			}
		) as { $jazz: { id: string } };
		recordCreatedMapping({
			table: 'loadPercentageCalculator',
			row,
			created,
			appliedMapping,
			lookupByTable
		});
	}

	for (const row of sourceRows.plateCalculator) {
		const created = pushToList(replacementRoot.plateCalculator, {
			barWeight: row.barWeight,
			heavyCollars: row.heavyCollars,
			allowNonStandardConfig: row.allowNonStandardConfig,
			updatedAt: row.updatedAt
		}) as { $jazz: { id: string } };
		recordCreatedMapping({
			table: 'plateCalculator',
			row,
			created,
			appliedMapping,
			lookupByTable
		});
	}

	for (const row of sourceRows.exercises) {
		const created = pushToList(replacementRoot.exercises, {
			name: row.name,
			executionType: row.executionType,
			loadType: row.loadType,
			muscleGroups: row.muscleGroups,
			updatedAt: row.updatedAt
		}) as { $jazz: { id: string } };
		const sourceId = recordCreatedMapping({
			table: 'exercises',
			row,
			created,
			appliedMapping,
			lookupByTable
		});
		if (sourceId) {
			exercisesBySourceId.set(sourceId, created);
		}
	}

	for (const row of sourceRows.programTemplates) {
		const created = pushToList(
			replacementRoot.programTemplates,
			{
				name: row.name,
				notes: row.notes,
				totalWeeks: row.totalWeeks,
				status: row.status,
				programWorkouts: [],
				updatedAt: row.updatedAt
			}
		) as { $jazz: { id: string } };
		const sourceId = recordCreatedMapping({
			table: 'programTemplates',
			row,
			created,
			appliedMapping,
			lookupByTable
		});
		if (sourceId) {
			programTemplatesBySourceId.set(sourceId, created);
		}
	}

	for (const row of sourceRows.programWorkouts) {
		const programTemplate = requireMappedEntity(
			programTemplatesBySourceId,
			row.programTemplateId,
			'programTemplate'
		) as {
			programWorkouts: { $jazz: { push: (...items: unknown[]) => number }; length: number };
		};

		const created = pushToList(programTemplate.programWorkouts, {
			programTemplate,
			performanceGroups: [],
			weekNumber: row.weekNumber,
			slotOrder: row.slotOrder,
			trackKey: row.trackKey,
			label: row.label,
			notes: row.notes,
			updatedAt: row.updatedAt
		}) as { $jazz: { id: string } };
		const sourceId = recordCreatedMapping({
			table: 'programWorkouts',
			row,
			created,
			appliedMapping,
			lookupByTable
		});
		if (sourceId) {
			programWorkoutsBySourceId.set(sourceId, created);
		}
	}

	for (const row of sourceRows.workouts) {
		const sourceProgramWorkout = row.sourceProgramWorkoutId
			? requireMappedEntity(
					programWorkoutsBySourceId,
					row.sourceProgramWorkoutId,
					'workout.sourceProgramWorkoutId'
				)
			: undefined;

		const created = pushToList(replacementRoot.workouts, {
			title: row.title,
			date: row.date,
			notes: row.notes,
			bodyweight: row.bodyweight,
			bodyweightUnit: row.bodyweightUnit,
			sourceProgramWorkout: sourceProgramWorkout as never,
			performanceGroups: [],
			updatedAt: row.updatedAt
		}) as { $jazz: { id: string } };
		const sourceId = recordCreatedMapping({
			table: 'workouts',
			row,
			created,
			appliedMapping,
			lookupByTable
		});
		if (sourceId) {
			workoutsBySourceId.set(sourceId, created);
		}
	}

	for (const row of sourceRows.performanceGroups) {
		const workout = row.workoutId
			? requireMappedEntity(workoutsBySourceId, row.workoutId, 'performanceGroup.workoutId')
			: undefined;
		const programWorkout = row.programWorkoutId
			? requireMappedEntity(
					programWorkoutsBySourceId,
					row.programWorkoutId,
					'performanceGroup.programWorkoutId'
				)
			: undefined;

		if (!workout && !programWorkout) {
			throw new Error(
				'Performance group row must reference either workoutId or programWorkoutId.'
			);
		}

		const parent = (workout ?? programWorkout) as {
			performanceGroups: { $jazz: { push: (...items: unknown[]) => number }; length: number };
		};

		const created = pushToList(parent.performanceGroups, {
			workout: workout as never,
			programWorkout: programWorkout as never,
			performances: [],
			label: row.label,
			workoutOrder: row.workoutOrder,
			updatedAt: row.updatedAt
		}) as { $jazz: { id: string } };
		const sourceId = recordCreatedMapping({
			table: 'performanceGroups',
			row,
			created,
			appliedMapping,
			lookupByTable
		});
		if (sourceId) {
			performanceGroupsBySourceId.set(sourceId, created);
		}
	}

	for (const row of sourceRows.performances) {
		const performanceGroup = requireMappedEntity(
			performanceGroupsBySourceId,
			row.performanceGroupId,
			'performance.performanceGroupId'
		);
		const exercise = requireMappedEntity(exercisesBySourceId, row.exerciseId, 'performance.exerciseId');
		const workout = row.workoutId
			? requireMappedEntity(workoutsBySourceId, row.workoutId, 'performance.workoutId')
			: undefined;
		const programWorkout = row.programWorkoutId
			? requireMappedEntity(
					programWorkoutsBySourceId,
					row.programWorkoutId,
					'performance.programWorkoutId'
				)
			: undefined;

		const group = performanceGroup as {
			performances: { $jazz: { push: (...items: unknown[]) => number }; length: number };
		};

		const created = pushToList(group.performances, {
			performanceGroup: performanceGroup as never,
			exercise: exercise as never,
			workout: workout as never,
			programWorkout: programWorkout as never,
			performanceSets: [],
			programWorkoutExerciseTargets: [],
			groupOrder: row.groupOrder,
			note: row.note,
			programTargets: row.programTargets,
			weightUnit: row.weightUnit,
			updatedAt: row.updatedAt
		}) as { $jazz: { id: string } };
		const sourceId = recordCreatedMapping({
			table: 'performances',
			row,
			created,
			appliedMapping,
			lookupByTable
		});
		if (sourceId) {
			performancesBySourceId.set(sourceId, created);
		}
	}

	for (const row of sourceRows.performanceSets) {
		const performance = requireMappedEntity(
			performancesBySourceId,
			row.performanceId,
			'performanceSet.performanceId'
		) as {
			performanceSets: { $jazz: { push: (...items: unknown[]) => number }; length: number };
		};

		const created = pushToList(performance.performanceSets, {
			performance: performance as never,
			weight: row.weight,
			reps: row.reps,
			durationSeconds: row.durationSeconds,
			note: row.note,
			performanceOrder: row.performanceOrder,
			updatedAt: row.updatedAt
		}) as { $jazz: { id: string } };
		recordCreatedMapping({
			table: 'performanceSets',
			row,
			created,
			appliedMapping,
			lookupByTable
		});
	}

	for (const row of sourceRows.programWorkoutExerciseTargets) {
		const performance = requireMappedEntity(
			performancesBySourceId,
			row.programWorkoutExerciseId,
			'programWorkoutExerciseTarget.programWorkoutExerciseId'
		) as {
			programWorkoutExerciseTargets: {
				$jazz: { push: (...items: unknown[]) => number };
				length: number;
			};
		};

		const created = pushToList(
			performance.programWorkoutExerciseTargets,
			{
				performance: performance as never,
				targetSetRange: row.targetSetRange,
				targetRepsRange: row.targetRepsRange,
				targetDuration: row.targetDuration,
				targetOrder: row.targetOrder,
				updatedAt: row.updatedAt
			}
		) as { $jazz: { id: string } };
		recordCreatedMapping({
			table: 'programWorkoutExerciseTargets',
			row,
			created,
			appliedMapping,
			lookupByTable
		});
	}

	for (const row of sourceRows.programRuns) {
		const programTemplate = requireMappedEntity(
			programTemplatesBySourceId,
			row.programTemplateId,
			'programRun.programTemplateId'
		);

		const created = pushToList(replacementRoot.programRuns, {
			programTemplate: programTemplate as never,
			status: row.status,
			startedAt: row.startedAt,
			endedAt: row.endedAt,
			programRunSessions: [],
			updatedAt: row.updatedAt
		}) as { $jazz: { id: string } };
		const sourceId = recordCreatedMapping({
			table: 'programRuns',
			row,
			created,
			appliedMapping,
			lookupByTable
		});
		if (sourceId) {
			programRunsBySourceId.set(sourceId, created);
		}
	}

	for (const row of sourceRows.programRunSessions) {
		const programRun = requireMappedEntity(
			programRunsBySourceId,
			row.programRunId,
			'programRunSession.programRunId'
		) as {
			programRunSessions: { $jazz: { push: (...items: unknown[]) => number }; length: number };
		};
		const programWorkout = requireMappedEntity(
			programWorkoutsBySourceId,
			row.programWorkoutId,
			'programRunSession.programWorkoutId'
		);
		const workout = row.workoutId
			? requireMappedEntity(workoutsBySourceId, row.workoutId, 'programRunSession.workoutId')
			: undefined;

		const created = pushToList(programRun.programRunSessions, {
			programRun: programRun as never,
			programWorkout: programWorkout as never,
			workout: workout as never,
			skippedAt: row.skippedAt,
			updatedAt: row.updatedAt
		}) as { $jazz: { id: string } };
		const sourceId = recordCreatedMapping({
			table: 'programRunSessions',
			row,
			created,
			appliedMapping,
			lookupByTable
		});
		if (sourceId) {
			programRunSessionsBySourceId.set(sourceId, created);
		}
	}

	for (const row of sourceRows.workouts) {
		const sourceId = getSourceId(row);
		if (!sourceId) {
			continue;
		}

		const workout = workoutsBySourceId.get(sourceId) as {
			$jazz: { set: (key: string, value: unknown) => void };
		} | undefined;
		if (!workout) {
			continue;
		}

		if (row.programRunId) {
			const programRun = requireMappedEntity(
				programRunsBySourceId,
				row.programRunId,
				'workout.programRunId'
			);
			workout.$jazz.set('programRun', programRun);
		}

		if (row.programRunSessionId) {
			const programRunSession = requireMappedEntity(
				programRunSessionsBySourceId,
				row.programRunSessionId,
				'workout.programRunSessionId'
			);
			workout.$jazz.set('programRunSession', programRunSession);
		}
	}

	const importedEntityRows = buildImportedEntityRows(sourceRows, lookupByTable);
	const targetReport = createMigrationTargetReportFromEntityRows({
		entityRows: importedEntityRows,
		smokeChecks: [
			{
				name: 'migration-apply-write',
				ok: true,
				details: 'Applied deterministic Convex snapshot into a replacement Jazz root.'
			}
		]
	});

	if (!targetReport.referentialChecks.ok || !targetReport.invariantChecks.ok) {
		const messages = [
			'Generated post-import report failed checks; replacement root will not be activated.',
			...targetReport.referentialChecks.violations,
			...targetReport.invariantChecks.violations
		];
		throw new Error(messages.join('\n'));
	}

	input.worker.$jazz.set('root', replacementRoot);
	await input.worker.$jazz.waitForAllCoValuesSync();

	let deletedPreviousRoot = false;
	if (previousRootId && previousRootId !== replacementRoot.$jazz.id) {
		await deleteCoValues(JazzUserSpace, previousRootId, { loadAs: input.worker });
		await input.worker.$jazz.waitForAllCoValuesSync();
		deletedPreviousRoot = true;
	}

	for (const table of CONVEX_ENTITY_TABLES) {
		appliedMapping[table].duplicateSourceIds.sort((left, right) => left.localeCompare(right));
	}

	return {
		targetReport,
		appliedIdMappingByTable: appliedMapping,
		rootSwitch: {
			previousRootId,
			replacementRootId: replacementRoot.$jazz.id,
			deletedPreviousRoot
		}
	};
};
