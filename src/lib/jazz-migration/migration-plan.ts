import {
	CONVEX_ENTITY_TABLES,
	type ConvexEntityTable,
	type MigrationAccount
} from './preflight-guardrails';
import { createMigrationTargetReportFromSnapshotRows, type MigrationTargetReport } from './migration-target-report';
import {
	createDeterministicConvexSnapshotExport,
	type DeterministicConvexSnapshotExport
} from './snapshot-utils';

export interface IdMappingEntry {
	sourceId: string;
	plannedJazzId: string;
}

export interface TableIdMappingPlan {
	mappings: IdMappingEntry[];
	missingSourceIdRows: number;
	duplicateSourceIds: string[];
}

export type IdMappingPlanByTable = Record<ConvexEntityTable, TableIdMappingPlan>;

export interface UserOwnershipCheck {
	ok: boolean;
	discoveredUserIds: string[];
	missingUserIdRows: number;
	mismatchedRows: string[];
}

export interface ConvexToJazzMigrationPlan {
	schemaVersion: 1;
	generatedAt: string;
	mode: 'dry-run';
	account: MigrationAccount;
	sourceUserId: string;
	targetAccountId: string;
	atomicImportSemantics: 'full-replace-root-switch';
	atomicImportPhases: string[];
	tableCounts: DeterministicConvexSnapshotExport['tableCounts'];
	userOwnershipCheck: UserOwnershipCheck;
	readiness: {
		ok: boolean;
		blockers: string[];
	};
}

export interface ConvexToJazzMigrationPlanArtifacts {
	deterministicSnapshot: DeterministicConvexSnapshotExport;
	idMappingPlan: IdMappingPlanByTable;
	targetReport: MigrationTargetReport;
	migrationPlan: ConvexToJazzMigrationPlan;
}

const atomicImportPhases: string[] = [
	'Build complete replacement Jazz account-root graph from deterministic Convex snapshot.',
	'Validate replacement graph (counts, referential integrity, invariants, smoke checks).',
	'Switch active account root pointer to the validated replacement graph.',
	'Delete previous root graph only after successful pointer switch.'
];

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

const rowIdentity = (table: ConvexEntityTable, row: unknown, index: number): string => {
	const sourceId = getSourceId(row);
	return sourceId ? `${table}:${sourceId}` : `${table}#${index}`;
};

const createPlannedJazzId = (
	targetAccountId: string,
	table: ConvexEntityTable,
	mappingIndex: number
): string => {
	return [
		'planned',
		targetAccountId,
		table,
		String(mappingIndex).padStart(6, '0')
	].join(':');
};

const buildIdMappingPlan = (
	targetAccountId: string,
	deterministicSnapshot: DeterministicConvexSnapshotExport
): IdMappingPlanByTable => {
	return CONVEX_ENTITY_TABLES.reduce<IdMappingPlanByTable>((acc, table) => {
		const rows = deterministicSnapshot.tables[table];
		const seenSourceIds = new Set<string>();
		const duplicateSourceIds = new Set<string>();
		let missingSourceIdRows = 0;
		const mappings: IdMappingEntry[] = [];
		let mappingIndex = 0;

		for (const row of rows) {
			const sourceId = getSourceId(row);
			if (!sourceId) {
				missingSourceIdRows += 1;
				continue;
			}

			if (seenSourceIds.has(sourceId)) {
				duplicateSourceIds.add(sourceId);
				continue;
			}

			seenSourceIds.add(sourceId);
			mappings.push({
				sourceId,
				plannedJazzId: createPlannedJazzId(targetAccountId, table, mappingIndex)
			});
			mappingIndex += 1;
		}

		acc[table] = {
			mappings,
			missingSourceIdRows,
			duplicateSourceIds: Array.from(duplicateSourceIds).sort((left, right) =>
				left.localeCompare(right)
			)
		};
		return acc;
	}, {} as IdMappingPlanByTable);
};

const buildUserOwnershipCheck = (
	sourceUserId: string,
	deterministicSnapshot: DeterministicConvexSnapshotExport
): UserOwnershipCheck => {
	const discoveredUserIds = new Set<string>();
	let missingUserIdRows = 0;
	const mismatchedRows: string[] = [];

	for (const table of CONVEX_ENTITY_TABLES) {
		const rows = deterministicSnapshot.tables[table];
		for (const [index, row] of rows.entries()) {
			if (!row || typeof row !== 'object' || Array.isArray(row)) {
				missingUserIdRows += 1;
				continue;
			}

			const rowRecord = row as Record<string, unknown>;
			const rowUserId = asString(rowRecord.userId);
			if (!rowUserId) {
				missingUserIdRows += 1;
				continue;
			}

			discoveredUserIds.add(rowUserId);
			if (rowUserId !== sourceUserId) {
				mismatchedRows.push(rowIdentity(table, row, index));
			}
		}
	}

	return {
		ok: mismatchedRows.length === 0 && missingUserIdRows === 0,
		discoveredUserIds: Array.from(discoveredUserIds).sort((left, right) => left.localeCompare(right)),
		missingUserIdRows,
		mismatchedRows
	};
};

export const createConvexToJazzMigrationPlanArtifacts = (input: {
	account: MigrationAccount;
	sourceUserId: string;
	targetAccountId: string;
	rowsByTable: Record<string, unknown>;
	generatedAt?: string;
}): ConvexToJazzMigrationPlanArtifacts => {
	const generatedAt = input.generatedAt ?? new Date().toISOString();
	const deterministicSnapshot = createDeterministicConvexSnapshotExport({
		rowsByTable: input.rowsByTable,
		exportedAt: generatedAt
	});
	const idMappingPlan = buildIdMappingPlan(input.targetAccountId, deterministicSnapshot);
	const targetReport = createMigrationTargetReportFromSnapshotRows({
		rowsByTable: deterministicSnapshot.tables,
		smokeChecks: [
			{
				name: 'migration-plan-dry-run',
				ok: true,
				details: 'Dry-run artifacts generated; no Jazz writes executed.'
			}
		]
	});
	const userOwnershipCheck = buildUserOwnershipCheck(input.sourceUserId, deterministicSnapshot);
	const blockers: string[] = [];

	if (!userOwnershipCheck.ok) {
		if (userOwnershipCheck.missingUserIdRows > 0) {
			blockers.push(`Missing userId on ${userOwnershipCheck.missingUserIdRows} source rows.`);
		}
		if (userOwnershipCheck.mismatchedRows.length > 0) {
			blockers.push(
				`Found ${userOwnershipCheck.mismatchedRows.length} rows owned by a different user than --source-user-id.`
			);
		}
	}

	if (!targetReport.referentialChecks.ok) {
		blockers.push(
			`Referential integrity check failed with ${targetReport.referentialChecks.violations.length} violation(s).`
		);
	}

	if (!targetReport.invariantChecks.ok) {
		blockers.push(
			`Invariant check failed with ${targetReport.invariantChecks.violations.length} violation(s).`
		);
	}

	return {
		deterministicSnapshot,
		idMappingPlan,
		targetReport,
		migrationPlan: {
			schemaVersion: 1,
			generatedAt,
			mode: 'dry-run',
			account: input.account,
			sourceUserId: input.sourceUserId,
			targetAccountId: input.targetAccountId,
			atomicImportSemantics: 'full-replace-root-switch',
			atomicImportPhases: atomicImportPhases,
			tableCounts: deterministicSnapshot.tableCounts,
			userOwnershipCheck,
			readiness: {
				ok: blockers.length === 0,
				blockers
			}
		}
	};
};
