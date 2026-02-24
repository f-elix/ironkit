import { access, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { getWorkspaceRoot, loadConvexExportData } from './convex-export';

interface UserMapFile {
	schemaVersion: 1;
	generatedAt: string;
	entries: Array<{
		convexUserId: string;
		jazzUserId: string;
	}>;
}

const WORKSPACE_ROOT = getWorkspaceRoot();
const USER_MAP_PATH = resolve(WORKSPACE_ROOT, 'docs/jazz-migration/user-id-map.json');
const OVERWRITE_EXISTING_MAP = false;

const isRecord = (value: unknown): value is Record<string, unknown> => {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const asUnknownString = (value: unknown): string | null => {
	if (typeof value !== 'string') {
		return null;
	}
	return value.length > 0 ? value : null;
};

const collectConvexUserIds = (rowsByTable: Record<string, unknown>): string[] => {
	const userIds = new Set<string>();

	for (const rows of Object.values(rowsByTable)) {
		if (!Array.isArray(rows)) {
			continue;
		}
		for (const row of rows) {
			if (!isRecord(row)) {
				continue;
			}
			const userId = asUnknownString(row.userId);
			if (userId) {
				userIds.add(userId);
			}
		}
	}

	return Array.from(userIds).sort((left, right) => left.localeCompare(right));
};

const loadExistingMap = async (path: string): Promise<UserMapFile | null> => {
	try {
		const text = await readFile(path, 'utf8');
		return JSON.parse(text) as UserMapFile;
	} catch {
		return null;
	}
};

const main = async () => {
	if (!OVERWRITE_EXISTING_MAP) {
		let exists = false;
		try {
			await access(USER_MAP_PATH);
			exists = true;
		} catch {
			exists = false;
		}

		if (exists) {
			throw new Error(
				[
					`User map already exists: ${USER_MAP_PATH}`,
					'Set OVERWRITE_EXISTING_MAP=true in generate-user-map.ts if you want to recreate it.'
				].join('\n')
			);
		}
	}

	const { rowsByTable, zipPath } = await loadConvexExportData();
	const convexUserIds = collectConvexUserIds(rowsByTable);

	if (convexUserIds.length === 0) {
		throw new Error('No Convex user IDs found in export (expected rows with `userId`).');
	}

	const existingMap = await loadExistingMap(USER_MAP_PATH);
	const existingJazzUserIdByConvexUserId = new Map<string, string>();
	if (existingMap?.entries) {
		for (const entry of existingMap.entries) {
			if (entry.convexUserId && entry.jazzUserId) {
				existingJazzUserIdByConvexUserId.set(entry.convexUserId, entry.jazzUserId);
			}
		}
	}

	const userMap: UserMapFile = {
		schemaVersion: 1,
		generatedAt: new Date().toISOString(),
		entries: convexUserIds.map((convexUserId) => ({
			convexUserId,
			jazzUserId: existingJazzUserIdByConvexUserId.get(convexUserId) ?? ''
		}))
	};

	await mkdir(dirname(USER_MAP_PATH), { recursive: true });
	await writeFile(USER_MAP_PATH, `${JSON.stringify(userMap, null, 2)}\n`, 'utf8');

	process.stdout.write(
		[
			`Source export zip: ${zipPath}`,
			`Wrote user map: ${USER_MAP_PATH}`,
			`Discovered Convex users: ${convexUserIds.join(', ')}`,
			'Fill missing `jazzUserId` values, then run the seeding script.'
		].join('\n') + '\n'
	);
};

main().catch((error: unknown) => {
	const message = error instanceof Error ? error.message : String(error);
	console.error(message);
	process.exit(1);
});
