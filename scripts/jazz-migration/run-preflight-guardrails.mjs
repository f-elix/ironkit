import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(scriptDirectory, '../..');
const outDir = join(tmpdir(), 'ironkit-jazz-migration-cli-cjs');

const run = (command, args) => {
	return spawnSync(command, args, {
		cwd: workspaceRoot,
		stdio: 'inherit'
	});
};

const tscArgs = [
	'exec',
	'tsc',
	'--outDir',
	outDir,
	'--module',
	'commonjs',
	'--moduleResolution',
	'node',
	'--target',
	'ESNext',
	'--strict',
	'scripts/jazz-migration/preflight-guardrails.ts',
	'src/lib/jazz-migration/preflight-guardrails.ts'
];

const tscResult = run('pnpm', tscArgs);
if (tscResult.status !== 0) {
	process.exit(tscResult.status ?? 1);
}

const modeArgs = process.argv.slice(2);
if (modeArgs.length === 0) {
	process.stderr.write(
		'Usage: node scripts/jazz-migration/run-preflight-guardrails.mjs <baseline|evaluate> [args...]\n'
	);
	process.exit(1);
}

const cliScriptPath = resolve(outDir, 'scripts/jazz-migration/preflight-guardrails.js');
const cliResult = run('node', [cliScriptPath, ...modeArgs]);
process.exit(cliResult.status ?? 1);
