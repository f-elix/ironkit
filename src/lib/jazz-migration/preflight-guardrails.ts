export const CONVEX_ENTITY_TABLES = [
	'weightConverter',
	'coefficientCalculator',
	'loadPercentageCalculator',
	'plateCalculator',
	'exercises',
	'workouts',
	'performanceGroups',
	'performances',
	'performanceSets',
	'programWorkoutExerciseTargets',
	'programTemplates',
	'programWorkouts',
	'programRuns',
	'programRunSessions'
] as const;

export type ConvexEntityTable = (typeof CONVEX_ENTITY_TABLES)[number];

export type MigrationAccount = 'dev' | 'prod';

export type EntityCounts = Record<ConvexEntityTable, number>;

export type GuardrailSeverity = 'pass' | 'fail';

export interface ReferentialCheckResult {
	ok: boolean;
	violations: string[];
}

export interface InvariantCheckResult {
	ok: boolean;
	violations: string[];
}

export interface SmokeCheckResult {
	name: string;
	ok: boolean;
	details?: string;
}

export interface ConvexBaselineSnapshot {
	schemaVersion: 1;
	account: MigrationAccount;
	capturedAt: string;
	tableCounts: EntityCounts;
}

export interface PreflightRunInput {
	baseline: ConvexBaselineSnapshot;
	targetCounts: Partial<Record<ConvexEntityTable, number>>;
	referentialChecks: ReferentialCheckResult;
	invariantChecks: InvariantCheckResult;
	smokeChecks: SmokeCheckResult[];
}

export interface GuardrailGateResult {
	gateId: 'table-parity' | 'referential-integrity' | 'invariants' | 'smoke';
	status: GuardrailSeverity;
	details: string[];
}

export interface PreflightEvaluation {
	account: MigrationAccount;
	status: GuardrailSeverity;
	gates: GuardrailGateResult[];
	abort: {
		shouldAbort: boolean;
		reasons: string[];
	};
	rerunProcedure: string[];
	finalCutoverSequence: string[];
}

export interface SnapshotRowsByTable {
	[key: string]: unknown;
}

export const FINAL_CUTOVER_SEQUENCE: string[] = [
	'Run final production migration script with atomic full-replace enabled.',
	'Run guardrails evaluation (table parity, referential checks, invariants, smoke checks).',
	'Deploy the Jazz-backed app immediately after all guardrails pass.'
];

export const ABORT_CRITERIA: string[] = [
	'Any table count parity mismatch between Convex baseline and Jazz target.',
	'Any referential integrity violation detected in migrated target data.',
	'Any invariant violation detected in migrated target data.',
	'Any required smoke check fails.'
];

export const RERUN_PROCEDURE: string[] = [
	'Abort deployment and keep Convex-backed release live.',
	'Discard target Jazz root produced by the failed run.',
	'Fix mapping/schema/import issue causing the failed gate.',
	'Re-run migration script as a full atomic replace from a fresh Convex snapshot.',
	'Re-run all guardrails and proceed only when every gate passes.'
];

export const emptyEntityCounts = (): EntityCounts => {
	return CONVEX_ENTITY_TABLES.reduce<EntityCounts>((acc, table) => {
		acc[table] = 0;
		return acc;
	}, {} as EntityCounts);
};

const normalizeRowArray = (value: unknown): unknown[] => {
	if (!Array.isArray(value)) {
		return [];
	}
	return value;
};

export const countsFromSnapshotRows = (rowsByTable: SnapshotRowsByTable): EntityCounts => {
	const counts = emptyEntityCounts();

	for (const table of CONVEX_ENTITY_TABLES) {
		counts[table] = normalizeRowArray(rowsByTable[table]).length;
	}

	return counts;
};

export const createBaselineSnapshot = (input: {
	account: MigrationAccount;
	capturedAt: string;
	rowsByTable: SnapshotRowsByTable;
}): ConvexBaselineSnapshot => {
	return {
		schemaVersion: 1,
		account: input.account,
		capturedAt: input.capturedAt,
		tableCounts: countsFromSnapshotRows(input.rowsByTable)
	};
};

const buildCountParityGate = (
	baseline: ConvexBaselineSnapshot,
	targetCounts: Partial<Record<ConvexEntityTable, number>>
): GuardrailGateResult => {
	const details: string[] = [];

	for (const table of CONVEX_ENTITY_TABLES) {
		const baselineCount = baseline.tableCounts[table];
		const targetCount = targetCounts[table];

		if (targetCount === undefined) {
			details.push(`${table}: missing in target parity report (expected ${baselineCount}).`);
			continue;
		}

		if (targetCount !== baselineCount) {
			details.push(`${table}: expected ${baselineCount}, got ${targetCount}.`);
		}
	}

	return {
		gateId: 'table-parity',
		status: details.length === 0 ? 'pass' : 'fail',
		details: details.length === 0 ? ['All table counts match baseline snapshot.'] : details
	};
};

const buildReferentialGate = (referentialChecks: ReferentialCheckResult): GuardrailGateResult => {
	if (referentialChecks.ok) {
		return {
			gateId: 'referential-integrity',
			status: 'pass',
			details: ['No referential integrity violations detected.']
		};
	}

	return {
		gateId: 'referential-integrity',
		status: 'fail',
		details:
			referentialChecks.violations.length > 0
				? referentialChecks.violations
				: ['Referential integrity check failed without violation details.']
	};
};

const buildInvariantGate = (invariantChecks: InvariantCheckResult): GuardrailGateResult => {
	if (invariantChecks.ok) {
		return {
			gateId: 'invariants',
			status: 'pass',
			details: ['Invariant checks passed.']
		};
	}

	return {
		gateId: 'invariants',
		status: 'fail',
		details:
			invariantChecks.violations.length > 0
				? invariantChecks.violations
				: ['Invariant check failed without violation details.']
	};
};

const buildSmokeGate = (smokeChecks: SmokeCheckResult[]): GuardrailGateResult => {
	const failed = smokeChecks.filter((check) => !check.ok);

	if (failed.length === 0) {
		return {
			gateId: 'smoke',
			status: 'pass',
			details: ['All smoke checks passed.']
		};
	}

	const details = failed.map((check) => `${check.name}: ${check.details ?? 'failed'}`);

	return {
		gateId: 'smoke',
		status: 'fail',
		details
	};
};

export const evaluatePreflightRun = (input: PreflightRunInput): PreflightEvaluation => {
	const gates: GuardrailGateResult[] = [
		buildCountParityGate(input.baseline, input.targetCounts),
		buildReferentialGate(input.referentialChecks),
		buildInvariantGate(input.invariantChecks),
		buildSmokeGate(input.smokeChecks)
	];

	const failedGates = gates.filter((gate) => gate.status === 'fail');

	return {
		account: input.baseline.account,
		status: failedGates.length === 0 ? 'pass' : 'fail',
		gates,
		abort: {
			shouldAbort: failedGates.length > 0,
			reasons: failedGates.map((gate) => `Gate failed: ${gate.gateId}`)
		},
		rerunProcedure: RERUN_PROCEDURE,
		finalCutoverSequence: FINAL_CUTOVER_SEQUENCE
	};
};
