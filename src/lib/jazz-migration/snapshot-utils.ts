import {
	CONVEX_ENTITY_TABLES,
	countsFromSnapshotRows,
	type ConvexEntityTable,
	type EntityCounts,
	type SnapshotRowsByTable
} from './preflight-guardrails';

const DETERMINISTIC_ROW_SORT_FIELDS = [
	'_id',
	'id',
	'userId',
	'updatedAt',
	'date',
	'startedAt',
	'weekNumber',
	'slotOrder',
	'workoutOrder',
	'groupOrder',
	'performanceOrder',
	'targetOrder',
	'name',
	'title',
	'trackKey'
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> => {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const asPrimitiveComparable = (value: unknown): string | number | boolean | null => {
	if (
		typeof value === 'string' ||
		typeof value === 'number' ||
		typeof value === 'boolean' ||
		value === null
	) {
		return value;
	}
	return null;
};

const comparePrimitives = (
	left: string | number | boolean | null,
	right: string | number | boolean | null
): number => {
	if (typeof left === 'number' && typeof right === 'number') {
		return left - right;
	}

	if (typeof left === 'boolean' && typeof right === 'boolean') {
		if (left === right) {
			return 0;
		}
		return left ? 1 : -1;
	}

	return String(left ?? '').localeCompare(String(right ?? ''));
};

const toStableValue = (value: unknown): unknown => {
	if (Array.isArray(value)) {
		return value.map((entry) => toStableValue(entry));
	}

	if (!isRecord(value)) {
		return value;
	}

	const keys = Object.keys(value).sort((left, right) => left.localeCompare(right));
	const stableObject: Record<string, unknown> = {};

	for (const key of keys) {
		stableObject[key] = toStableValue(value[key]);
	}

	return stableObject;
};

const stableStringify = (value: unknown): string => {
	return JSON.stringify(toStableValue(value));
};

const compareRowsDeterministically = (leftRow: unknown, rightRow: unknown): number => {
	const leftRecord = isRecord(leftRow) ? leftRow : {};
	const rightRecord = isRecord(rightRow) ? rightRow : {};

	for (const field of DETERMINISTIC_ROW_SORT_FIELDS) {
		const leftValue = asPrimitiveComparable(leftRecord[field]);
		const rightValue = asPrimitiveComparable(rightRecord[field]);
		const comparison = comparePrimitives(leftValue, rightValue);
		if (comparison !== 0) {
			return comparison;
		}
	}

	return stableStringify(leftRow).localeCompare(stableStringify(rightRow));
};

export const sortRowsDeterministically = (rows: unknown[]): unknown[] => {
	const rowsWithIndex = rows.map((row, index) => ({ row, index }));

	rowsWithIndex.sort((left, right) => {
		const rowComparison = compareRowsDeterministically(left.row, right.row);
		if (rowComparison !== 0) {
			return rowComparison;
		}
		return left.index - right.index;
	});

	return rowsWithIndex.map(({ row }) => row);
};

export const extractSnapshotRowsByTable = (source: unknown): SnapshotRowsByTable => {
	if (!isRecord(source)) {
		throw new Error('Snapshot JSON must be an object.');
	}

	const maybeTables = source.tables;
	if (isRecord(maybeTables)) {
		return maybeTables;
	}

	return source;
};

export type DeterministicRowsByTable = Record<ConvexEntityTable, unknown[]>;

export interface DeterministicConvexSnapshotExport {
	schemaVersion: 1;
	exportedAt: string;
	tableOrder: readonly ConvexEntityTable[];
	tableCounts: EntityCounts;
	tables: DeterministicRowsByTable;
}

const rowsArray = (rowsByTable: SnapshotRowsByTable, table: ConvexEntityTable): unknown[] => {
	const maybeRows = rowsByTable[table];
	return Array.isArray(maybeRows) ? maybeRows : [];
};

export const createDeterministicRowsByTable = (
	rowsByTable: SnapshotRowsByTable
): DeterministicRowsByTable => {
	return CONVEX_ENTITY_TABLES.reduce<DeterministicRowsByTable>((acc, table) => {
		acc[table] = sortRowsDeterministically(rowsArray(rowsByTable, table));
		return acc;
	}, {} as DeterministicRowsByTable);
};

export const createDeterministicConvexSnapshotExport = (input: {
	rowsByTable: SnapshotRowsByTable;
	exportedAt?: string;
}): DeterministicConvexSnapshotExport => {
	const tables = createDeterministicRowsByTable(input.rowsByTable);
	return {
		schemaVersion: 1,
		exportedAt: input.exportedAt ?? new Date().toISOString(),
		tableOrder: CONVEX_ENTITY_TABLES,
		tableCounts: countsFromSnapshotRows(tables),
		tables
	};
};
