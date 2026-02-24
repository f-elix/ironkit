import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import {
	createBaselineSnapshot,
	evaluatePreflightRun,
	type ConvexBaselineSnapshot,
	type MigrationAccount,
	type PreflightRunInput
} from '../../src/lib/jazz-migration/preflight-guardrails';
import { extractSnapshotRowsByTable } from '../../src/lib/jazz-migration/snapshot-utils';

interface CliArgs {
	[flag: string]: string | boolean;
}

interface TargetRunReportFile {
	targetCounts: PreflightRunInput['targetCounts'];
	referentialChecks: PreflightRunInput['referentialChecks'];
	invariantChecks: PreflightRunInput['invariantChecks'];
	smokeChecks: PreflightRunInput['smokeChecks'];
}

const usage = [
	'Usage:',
	'  node scripts/jazz-migration/run-preflight-guardrails.mjs baseline --account dev|prod --snapshot ./snapshot.json --out ./baseline.json [--captured-at ISO_DATE]',
	'  node scripts/jazz-migration/run-preflight-guardrails.mjs evaluate --baseline ./baseline.json --target-report ./target-report.json --out ./guardrail-report.json'
].join('\n');

const parseArgs = (argv: string[]): CliArgs => {
	const args: CliArgs = {};

	for (let index = 0; index < argv.length; index += 1) {
		const token = argv[index];
		if (!token.startsWith('--')) {
			continue;
		}

		const [flag, inlineValue] = token.slice(2).split('=', 2);
		if (inlineValue !== undefined) {
			args[flag] = inlineValue;
			continue;
		}

		const nextToken = argv[index + 1];
		if (!nextToken || nextToken.startsWith('--')) {
			args[flag] = true;
			continue;
		}

		args[flag] = nextToken;
		index += 1;
	}

	return args;
};

const asString = (value: string | boolean | undefined): string | null => {
	if (typeof value !== 'string') {
		return null;
	}
	return value;
};

const isMigrationAccount = (value: string | null): value is MigrationAccount => {
	return value === 'dev' || value === 'prod';
};

const loadJsonFile = async <T>(filePath: string): Promise<T> => {
	const text = await readFile(resolve(filePath), 'utf8');
	return JSON.parse(text) as T;
};

const writeJsonFile = async (filePath: string, payload: unknown) => {
	const absolutePath = resolve(filePath);
	await mkdir(dirname(absolutePath), { recursive: true });
	await writeFile(absolutePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
};

const runBaselineMode = async (args: CliArgs) => {
	const account = asString(args.account);
	if (!isMigrationAccount(account)) {
		throw new Error('`--account` is required and must be dev or prod.');
	}

	const snapshotPath = asString(args.snapshot);
	if (!snapshotPath) {
		throw new Error('`--snapshot` is required.');
	}
	const resolvedSnapshotPath = resolve(snapshotPath);
	try {
		await access(resolvedSnapshotPath);
	} catch {
		throw new Error(
			[
				`Snapshot file not found: ${resolvedSnapshotPath}`,
				'Provide a real Convex snapshot JSON path for `--snapshot` (the docs use a placeholder path).'
			].join('\n')
		);
	}

	const outPath = asString(args.out);
	if (!outPath) {
		throw new Error('`--out` is required.');
	}

	const snapshotJson = await loadJsonFile<unknown>(resolvedSnapshotPath);
	const rowsByTable = extractSnapshotRowsByTable(snapshotJson);

	const baseline = createBaselineSnapshot({
		account,
		capturedAt: asString(args['captured-at']) ?? new Date().toISOString(),
		rowsByTable
	});

	await writeJsonFile(outPath, baseline);
	process.stdout.write(`Wrote baseline snapshot to ${resolve(outPath)}\n`);
};

const runEvaluateMode = async (args: CliArgs) => {
	const baselinePath = asString(args.baseline);
	if (!baselinePath) {
		throw new Error('`--baseline` is required.');
	}

	const targetReportPath = asString(args['target-report']);
	if (!targetReportPath) {
		throw new Error('`--target-report` is required.');
	}

	const outPath = asString(args.out);
	if (!outPath) {
		throw new Error('`--out` is required.');
	}

	const baseline = await loadJsonFile<ConvexBaselineSnapshot>(baselinePath);
	const targetReport = await loadJsonFile<TargetRunReportFile>(targetReportPath);

	const evaluation = evaluatePreflightRun({
		baseline,
		targetCounts: targetReport.targetCounts,
		referentialChecks: targetReport.referentialChecks,
		invariantChecks: targetReport.invariantChecks,
		smokeChecks: targetReport.smokeChecks
	});

	await writeJsonFile(outPath, evaluation);

	if (evaluation.abort.shouldAbort) {
		console.error(`Guardrails failed. See ${resolve(outPath)} for details.`);
		process.exitCode = 1;
		return;
	}

	process.stdout.write(`Guardrails passed. Report written to ${resolve(outPath)}\n`);
};

const main = async () => {
	const [mode, ...rest] = process.argv.slice(2);
	if (mode !== 'baseline' && mode !== 'evaluate') {
		throw new Error(usage);
	}

	const args = parseArgs(rest);
	if (mode === 'baseline') {
		await runBaselineMode(args);
		return;
	}

	await runEvaluateMode(args);
};

main().catch((error: unknown) => {
	const message = error instanceof Error ? error.message : String(error);
	console.error(message);
	console.error('\n' + usage);
	process.exit(1);
});
