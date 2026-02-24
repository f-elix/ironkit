import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(scriptDirectory, '../..');
const scriptArgs = process.argv.slice(2);

const scriptPath = resolve(workspaceRoot, 'scripts/jazz-migration/generate-user-map.ts');
const result = spawnSync('pnpm', ['exec', 'tsx', scriptPath, ...scriptArgs], {
	cwd: workspaceRoot,
	stdio: 'inherit'
});

process.exit(result.status ?? 1);
