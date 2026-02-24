import { spawnSync } from 'node:child_process';
import { mkdtemp, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	CONVEX_ENTITY_TABLES,
	type ConvexEntityTable
} from '../../src/lib/jazz-migration/preflight-guardrails';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(scriptDirectory, '../..');

const BETTER_AUTH_USERS_ENTRY = '_components/betterAuth/user/documents.jsonl';

const parseJsonFromJsonl = (jsonl: string): unknown[] => {
	const rows: unknown[] = [];
	for (const line of jsonl.split('\n')) {
		const trimmed = line.trim();
		if (!trimmed) {
			continue;
		}
		rows.push(JSON.parse(trimmed));
	}
	return rows;
};

const readZipEntryJsonl = (zipPath: string, entryPath: string): unknown[] => {
	const result = spawnSync('unzip', ['-p', zipPath, entryPath], {
		cwd: workspaceRoot,
		encoding: 'utf8',
		maxBuffer: 1024 * 1024 * 200
	});

	if (result.status !== 0) {
		const stderr = (result.stderr ?? '').toLowerCase();
		if (stderr.includes('filename not matched')) {
			return [];
		}
		throw new Error(
			[
				`Failed to read export entry: ${entryPath}`,
				result.stderr?.trim() ?? '',
				result.stdout?.trim() ?? ''
			]
				.filter((part) => part.length > 0)
				.join('\n')
		);
	}

	return parseJsonFromJsonl(result.stdout ?? '');
};

const runConvexExportToZip = async (): Promise<{ zipPath: string }> => {
	const exportDir = await mkdtemp(resolve(tmpdir(), 'ironkit-convex-export-'));

	const result = spawnSync('pnpm', ['exec', 'convex', 'export', '--path', exportDir], {
		cwd: workspaceRoot,
		encoding: 'utf8',
		maxBuffer: 1024 * 1024 * 20
	});

	if (result.status !== 0) {
		throw new Error(
			[
				'Failed to export snapshot from Convex.',
				result.stderr?.trim() ?? '',
				result.stdout?.trim() ?? ''
			]
				.filter((part) => part.length > 0)
				.join('\n')
		);
	}

	const files = await readdir(exportDir);
	const zipName = files.find((file) => file.endsWith('.zip'));
	if (!zipName) {
		throw new Error(`Convex export did not produce a zip file in ${exportDir}.`);
	}

	return {
		zipPath: resolve(exportDir, zipName)
	};
};

export const loadConvexExportData = async (): Promise<{
	rowsByTable: Record<ConvexEntityTable, unknown[]>;
	betterAuthUsers: unknown[];
	zipPath: string;
}> => {
	const { zipPath } = await runConvexExportToZip();

	const rowsByTable = CONVEX_ENTITY_TABLES.reduce<Record<ConvexEntityTable, unknown[]>>(
		(acc, table) => {
			acc[table] = readZipEntryJsonl(zipPath, `${table}/documents.jsonl`);
			return acc;
		},
		{} as Record<ConvexEntityTable, unknown[]>
	);

	const betterAuthUsers = readZipEntryJsonl(zipPath, BETTER_AUTH_USERS_ENTRY);

	return {
		rowsByTable,
		betterAuthUsers,
		zipPath
	};
};

export const getWorkspaceRoot = () => workspaceRoot;
