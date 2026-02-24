import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { symmetricDecrypt } from 'better-auth/crypto';
import { startWorker } from 'jazz-tools/worker';
import { JazzAccount } from '../../src/lib/jazz/schema';
import { applyDeterministicSnapshotToJazzAccount } from '../../src/lib/jazz-migration/apply-import';
import { createDeterministicConvexSnapshotExport } from '../../src/lib/jazz-migration/snapshot-utils';
import { getWorkspaceRoot, loadConvexExportData } from './convex-export';

interface UserIdMapEntry {
	convexUserId: string;
	jazzUserId: string;
}

interface SeedResult {
	convexUserId: string;
	jazzUserId: string;
	status: 'applied' | 'skipped' | 'failed';
	selectedRows: number;
	excludedRows: number;
	missingUserIdRows: number;
	outputDir?: string;
	error?: string;
}

interface DecryptedJazzCredentials {
	accountID: string;
	accountSecret: string;
}

const WORKSPACE_ROOT = getWorkspaceRoot();
const USER_MAP_PATH = resolve(WORKSPACE_ROOT, 'docs/jazz-migration/user-id-map.json');
const RUNS_ROOT = resolve(WORKSPACE_ROOT, 'docs/jazz-migration/runs');
const ONLY_CONVEX_USER_ID: string | null = null;
const BETTER_AUTH_SECRET_ENV_KEY = 'BETTER_AUTH_SECRET';
const SYNC_SERVER = process.env.PUBLIC_JAZZ_SYNC_URL ?? 'wss://cloud.jazz.tools';

const isRecord = (value: unknown): value is Record<string, unknown> => {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const asUnknownString = (value: unknown): string | null => {
	if (typeof value !== 'string') {
		return null;
	}
	return value.length > 0 ? value : null;
};

const parseUserMapEntries = (value: unknown): UserIdMapEntry[] => {
	if (!isRecord(value)) {
		throw new Error('User map JSON must be an object.');
	}

	if (!Array.isArray(value.entries)) {
		throw new Error('User map must include an `entries` array.');
	}

	const entries: UserIdMapEntry[] = [];
	for (const entry of value.entries) {
		if (!isRecord(entry)) {
			continue;
		}
		const convexUserId = asUnknownString(entry.convexUserId);
		const jazzUserId = asUnknownString(entry.jazzUserId);
		if (convexUserId && jazzUserId) {
			entries.push({ convexUserId, jazzUserId });
		}
	}

	if (entries.length === 0) {
		throw new Error(`No valid user mappings found in ${USER_MAP_PATH}.`);
	}

	const seen = new Set<string>();
	for (const entry of entries) {
		if (seen.has(entry.convexUserId)) {
			throw new Error(`Duplicate convexUserId in user map: ${entry.convexUserId}`);
		}
		seen.add(entry.convexUserId);
	}

	return entries.sort((left, right) => left.convexUserId.localeCompare(right.convexUserId));
};

const filterRowsByConvexUserId = (input: {
	rowsByTable: Record<string, unknown>;
	convexUserId: string;
}): {
	filteredRowsByTable: Record<string, unknown>;
	selectedRows: number;
	excludedRows: number;
	missingUserIdRows: number;
} => {
	const filteredRowsByTable: Record<string, unknown> = {};
	let selectedRows = 0;
	let excludedRows = 0;
	let missingUserIdRows = 0;

	for (const [table, rows] of Object.entries(input.rowsByTable)) {
		if (!Array.isArray(rows)) {
			filteredRowsByTable[table] = rows;
			continue;
		}

		const filteredRows = rows.filter((row) => {
			if (!isRecord(row)) {
				missingUserIdRows += 1;
				excludedRows += 1;
				return false;
			}

			const rowUserId = asUnknownString(row.userId);
			if (!rowUserId) {
				missingUserIdRows += 1;
				excludedRows += 1;
				return false;
			}

			if (rowUserId !== input.convexUserId) {
				excludedRows += 1;
				return false;
			}

			selectedRows += 1;
			return true;
		});

		filteredRowsByTable[table] = filteredRows;
	}

	return {
		filteredRowsByTable,
		selectedRows,
		excludedRows,
		missingUserIdRows
	};
};

const toRunSlug = (date: Date): string => {
	return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
};

const safePathSegment = (value: string): string => {
	return value.replace(/[^a-zA-Z0-9._-]/g, '_');
};

const loadEnvFromFile = async (path: string): Promise<Record<string, string>> => {
	try {
		const text = await readFile(path, 'utf8');
		const values: Record<string, string> = {};
		for (const line of text.split('\n')) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith('#')) {
				continue;
			}
			const eqIndex = trimmed.indexOf('=');
			if (eqIndex <= 0) {
				continue;
			}
			const key = trimmed.slice(0, eqIndex).trim();
			const value = trimmed.slice(eqIndex + 1).trim();
			values[key] = value.replace(/^['"]|['"]$/g, '');
		}
		return values;
	} catch {
		return {};
	}
};

const loadBetterAuthSecret = async (): Promise<string> => {
	const fromProcess = process.env[BETTER_AUTH_SECRET_ENV_KEY];
	if (fromProcess) {
		return fromProcess;
	}

	const fromLocalEnv = await loadEnvFromFile(resolve(WORKSPACE_ROOT, '.env.local'));
	if (fromLocalEnv[BETTER_AUTH_SECRET_ENV_KEY]) {
		return fromLocalEnv[BETTER_AUTH_SECRET_ENV_KEY];
	}

	const fromEnv = await loadEnvFromFile(resolve(WORKSPACE_ROOT, '.env'));
	if (fromEnv[BETTER_AUTH_SECRET_ENV_KEY]) {
		return fromEnv[BETTER_AUTH_SECRET_ENV_KEY];
	}

	throw new Error(
		[
			`Missing ${BETTER_AUTH_SECRET_ENV_KEY}.`,
			'Needed to decrypt Jazz credentials stored by Better Auth.',
			`Set ${BETTER_AUTH_SECRET_ENV_KEY} in .env.local or your shell environment.`
		].join('\n')
	);
};

const buildCredentialsByConvexUserId = async (input: {
	betterAuthUsers: unknown[];
	betterAuthSecret: string;
}): Promise<{
	credentialsByConvexUserId: Map<string, DecryptedJazzCredentials>;
	decodeErrors: string[];
}> => {
	const credentialsByConvexUserId = new Map<string, DecryptedJazzCredentials>();
	const decodeErrors: string[] = [];

	for (const row of input.betterAuthUsers) {
		if (!isRecord(row)) {
			continue;
		}

		const convexUserId = asUnknownString(row._id);
		const encryptedCredentials = asUnknownString(row.encryptedCredentials);
		const accountIdFromRow = asUnknownString(row.accountID);

		if (!convexUserId || !encryptedCredentials) {
			continue;
		}

		try {
			const decrypted = await symmetricDecrypt({
				key: input.betterAuthSecret,
				data: encryptedCredentials
			});

			const parsed = JSON.parse(decrypted) as unknown;
			if (!isRecord(parsed)) {
				throw new Error('decrypted payload is not an object');
			}

			const accountID = asUnknownString(parsed.accountID) ?? accountIdFromRow;
			const accountSecret = asUnknownString(parsed.accountSecret);

			if (!accountID || !accountSecret) {
				throw new Error('missing accountID/accountSecret in decrypted payload');
			}

			credentialsByConvexUserId.set(convexUserId, {
				accountID,
				accountSecret
			});
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			decodeErrors.push(`${convexUserId}: ${message}`);
		}
	}

	return {
		credentialsByConvexUserId,
		decodeErrors
	};
};

const main = async () => {
	const betterAuthSecret = await loadBetterAuthSecret();
	const { rowsByTable, betterAuthUsers, zipPath } = await loadConvexExportData();
	const mapJson = JSON.parse(await readFile(USER_MAP_PATH, 'utf8')) as unknown;
	const allMappings = parseUserMapEntries(mapJson);
	const mappings = ONLY_CONVEX_USER_ID
		? allMappings.filter((entry) => entry.convexUserId === ONLY_CONVEX_USER_ID)
		: allMappings;

	if (mappings.length === 0) {
		throw new Error(`No map entry found for ONLY_CONVEX_USER_ID=${ONLY_CONVEX_USER_ID}.`);
	}

	const { credentialsByConvexUserId, decodeErrors } = await buildCredentialsByConvexUserId({
		betterAuthUsers,
		betterAuthSecret
	});

	if (credentialsByConvexUserId.size === 0) {
		throw new Error(
			[
				'No decryptable Jazz credentials were found in Better Auth user records.',
				'Make sure Jazz Better Auth server plugin is enabled and users have authenticated with Jazz credentials.',
				decodeErrors.length > 0 ? `Decrypt errors: ${decodeErrors.slice(0, 3).join(' | ')}` : ''
			]
				.filter((part) => part.length > 0)
				.join('\n')
		);
	}

	const runStartedAt = new Date();
	const runOutDir = resolve(RUNS_ROOT, `seed-${toRunSlug(runStartedAt)}`);
	await mkdir(runOutDir, { recursive: true });

	const results: SeedResult[] = [];

	for (const mapping of mappings) {
		const filtered = filterRowsByConvexUserId({
			rowsByTable,
			convexUserId: mapping.convexUserId
		});

		const userOutDir = resolve(
			runOutDir,
			`${safePathSegment(mapping.convexUserId)}__to__${safePathSegment(mapping.jazzUserId)}`
		);
		await mkdir(userOutDir, { recursive: true });

		if (filtered.selectedRows === 0) {
			results.push({
				convexUserId: mapping.convexUserId,
				jazzUserId: mapping.jazzUserId,
				status: 'skipped',
				selectedRows: filtered.selectedRows,
				excludedRows: filtered.excludedRows,
				missingUserIdRows: filtered.missingUserIdRows,
				outputDir: userOutDir,
				error: 'No rows found for this Convex user in export.'
			});
			continue;
		}

		const creds = credentialsByConvexUserId.get(mapping.convexUserId);
		if (!creds) {
			results.push({
				convexUserId: mapping.convexUserId,
				jazzUserId: mapping.jazzUserId,
				status: 'failed',
				selectedRows: filtered.selectedRows,
				excludedRows: filtered.excludedRows,
				missingUserIdRows: filtered.missingUserIdRows,
				outputDir: userOutDir,
				error:
					'No stored Jazz credentials found for this Convex user. User may need to sign in after Jazz server plugin is enabled.'
			});
			continue;
		}

		if (creds.accountID !== mapping.jazzUserId) {
			results.push({
				convexUserId: mapping.convexUserId,
				jazzUserId: mapping.jazzUserId,
				status: 'failed',
				selectedRows: filtered.selectedRows,
				excludedRows: filtered.excludedRows,
				missingUserIdRows: filtered.missingUserIdRows,
				outputDir: userOutDir,
				error: `Mapped jazzUserId (${mapping.jazzUserId}) does not match stored accountID (${creds.accountID}).`
			});
			continue;
		}

		const deterministicSnapshot = createDeterministicConvexSnapshotExport({
			rowsByTable: filtered.filteredRowsByTable,
			exportedAt: new Date().toISOString()
		});

		await writeFile(
			resolve(userOutDir, 'convex-deterministic-export.json'),
			`${JSON.stringify(deterministicSnapshot, null, 2)}\n`,
			'utf8'
		);

		const workerSession = await startWorker({
			accountID: creds.accountID,
			accountSecret: creds.accountSecret,
			syncServer: SYNC_SERVER,
			AccountSchema: JazzAccount,
			asActiveAccount: false
		});

		try {
			await workerSession.waitForConnection();
			const applyResult = await applyDeterministicSnapshotToJazzAccount({
				worker: workerSession.worker as never,
				deterministicSnapshot
			});

			await writeFile(
				resolve(userOutDir, 'id-map-actual.json'),
				`${JSON.stringify(applyResult.appliedIdMappingByTable, null, 2)}\n`,
				'utf8'
			);
			await writeFile(
				resolve(userOutDir, 'target-report.json'),
				`${JSON.stringify(applyResult.targetReport, null, 2)}\n`,
				'utf8'
			);
			await writeFile(
				resolve(userOutDir, 'apply-report.json'),
				`${JSON.stringify(
					{
						schemaVersion: 1,
						appliedAt: new Date().toISOString(),
						convexUserId: mapping.convexUserId,
						jazzUserId: mapping.jazzUserId,
						syncServer: SYNC_SERVER,
						filtering: {
							selectedRows: filtered.selectedRows,
							excludedRows: filtered.excludedRows,
							missingUserIdRows: filtered.missingUserIdRows
						},
						rootSwitch: applyResult.rootSwitch
					},
					null,
					2
				)}\n`,
				'utf8'
			);

			results.push({
				convexUserId: mapping.convexUserId,
				jazzUserId: mapping.jazzUserId,
				status: 'applied',
				selectedRows: filtered.selectedRows,
				excludedRows: filtered.excludedRows,
				missingUserIdRows: filtered.missingUserIdRows,
				outputDir: userOutDir
			});
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			results.push({
				convexUserId: mapping.convexUserId,
				jazzUserId: mapping.jazzUserId,
				status: 'failed',
				selectedRows: filtered.selectedRows,
				excludedRows: filtered.excludedRows,
				missingUserIdRows: filtered.missingUserIdRows,
				outputDir: userOutDir,
				error: message
			});
		} finally {
			await workerSession.shutdownWorker();
		}
	}

	const summary = {
		schemaVersion: 1,
		startedAt: runStartedAt.toISOString(),
		finishedAt: new Date().toISOString(),
		sourceExportZip: zipPath,
		userMapPath: USER_MAP_PATH,
		syncServer: SYNC_SERVER,
		credentials: {
			loadedUsers: credentialsByConvexUserId.size,
			decodeErrors: decodeErrors.slice(0, 20)
		},
		results
	};
	await writeFile(resolve(runOutDir, 'seed-report.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

	const applied = results.filter((result) => result.status === 'applied').length;
	const skipped = results.filter((result) => result.status === 'skipped').length;
	const failed = results.filter((result) => result.status === 'failed').length;

	process.stdout.write(
		[
			'Seeding run complete.',
			`Applied: ${applied}`,
			`Skipped: ${skipped}`,
			`Failed: ${failed}`,
			`Summary: ${resolve(runOutDir, 'seed-report.json')}`
		].join('\n') + '\n'
	);

	if (failed > 0) {
		process.exitCode = 1;
	}
};

main().catch((error: unknown) => {
	const message = error instanceof Error ? error.message : String(error);
	console.error(message);
	process.exit(1);
});
