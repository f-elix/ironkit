import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(scriptDirectory, '../..');
const modeArgs = process.argv.slice(2);

if (modeArgs.length === 0) {
	process.stderr.write(
		'Usage: node scripts/jazz-migration/run-migrate-convex-to-jazz.mjs <plan|apply> [args...]\n'
	);
	process.exit(1);
}

const cliScriptPath = resolve(workspaceRoot, 'scripts/jazz-migration/migrate-convex-to-jazz.ts');
const result = spawnSync('pnpm', ['exec', 'tsx', cliScriptPath, ...modeArgs], {
	cwd: workspaceRoot,
	stdio: 'inherit'
});

process.exit(result.status ?? 1);
