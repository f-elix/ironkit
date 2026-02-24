import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { startWorker } from 'jazz-tools/worker';
import { JazzAccount } from '../../src/lib/jazz/schema';
import { applyDeterministicSnapshotToJazzAccount } from '../../src/lib/jazz-migration/apply-import';
import { createConvexToJazzMigrationPlanArtifacts } from '../../src/lib/jazz-migration/migration-plan';
import {
	evaluatePreflightRun,
	type ConvexBaselineSnapshot,
	type MigrationAccount
} from '../../src/lib/jazz-migration/preflight-guardrails';
import { extractSnapshotRowsByTable } from '../../src/lib/jazz-migration/snapshot-utils';

interface CliArgs {
	[flag: string]: string | boolean;
}

interface ParsedMigrationRunArgs {
	account: MigrationAccount;
	sourceUserId: string;
	targetAccountId: string;
	resolvedOutDir: string;
	resolvedSnapshotPath: string;
	generatedAt: string;
	allowBlockers: boolean;
}

const usage = [
	'Usage:',
	'  node scripts/jazz-migration/run-migrate-convex-to-jazz.mjs plan \\',
	'    --account dev|prod \\',
	'    --snapshot ./convex-snapshot.json \\',
	'    --source-user-id convex-user-id \\',
	'    --target-account-id jazz-account-id \\',
	'    --out-dir ./docs/jazz-migration/runs/dev-rehearsal \\',
	'    [--generated-at ISO_DATE] [--allow-blockers]',
	'',
	'  node scripts/jazz-migration/run-migrate-convex-to-jazz.mjs apply \\',
	'    --account dev|prod \\',
	'    --snapshot ./convex-snapshot.json \\',
	'    --source-user-id convex-user-id \\',
	'    --target-account-id jazz-account-id \\',
	'    --target-account-secret sealerSecret_... \\',
	'    --out-dir ./docs/jazz-migration/runs/dev-rehearsal \\',
	'    --confirm apply-dev|apply-prod \\',
	'    [--generated-at ISO_DATE] [--allow-blockers] [--sync-server wss://cloud.jazz.tools] \\',
	'    [--baseline ./docs/jazz-migration/baselines/dev-convex-baseline.json]'
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
	return value.length > 0 ? value : null;
};

const isMigrationAccount = (value: string | null): value is MigrationAccount => {
	return value === 'dev' || value === 'prod';
};

const asBooleanFlag = (value: string | boolean | undefined): boolean => {
	if (value === true) {
		return true;
	}
	if (typeof value !== 'string') {
		return false;
	}
	return value === 'true' || value === '1' || value === 'yes';
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

const parseCommonRunArgs = async (args: CliArgs): Promise<ParsedMigrationRunArgs> => {
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
		throw new Error(`Snapshot file not found: ${resolvedSnapshotPath}`);
	}

	const sourceUserId = asString(args['source-user-id']);
	if (!sourceUserId) {
		throw new Error('`--source-user-id` is required.');
	}

	const targetAccountId = asString(args['target-account-id']);
	if (!targetAccountId) {
		throw new Error('`--target-account-id` is required.');
	}

	const outDir = asString(args['out-dir']);
	if (!outDir) {
		throw new Error('`--out-dir` is required.');
	}

	const resolvedOutDir = resolve(outDir);
	await mkdir(resolvedOutDir, { recursive: true });

	return {
		account,
		sourceUserId,
		targetAccountId,
		resolvedOutDir,
		resolvedSnapshotPath,
		generatedAt: asString(args['generated-at']) ?? new Date().toISOString(),
		allowBlockers: asBooleanFlag(args['allow-blockers'])
	};
};

const logBlockersAndSetExitCode = (blockers: string[]) => {
	console.error(
		[
			'Migration plan contains blockers. Re-run with `--allow-blockers` to proceed anyway.',
			...blockers.map((blocker) => `- ${blocker}`)
		].join('\n')
	);
	process.exitCode = 1;
};

const runPlanMode = async (args: CliArgs) => {
	const runArgs = await parseCommonRunArgs(args);
	const snapshotJson = await loadJsonFile<unknown>(runArgs.resolvedSnapshotPath);
	const rowsByTable = extractSnapshotRowsByTable(snapshotJson);
	const artifacts = createConvexToJazzMigrationPlanArtifacts({
		account: runArgs.account,
		sourceUserId: runArgs.sourceUserId,
		targetAccountId: runArgs.targetAccountId,
		rowsByTable,
		generatedAt: runArgs.generatedAt
	});

	const deterministicSnapshotPath = resolve(
		runArgs.resolvedOutDir,
		'convex-deterministic-export.json'
	);
	const idMappingPlanPath = resolve(runArgs.resolvedOutDir, 'id-map-plan.json');
	const targetReportPath = resolve(runArgs.resolvedOutDir, 'target-report.json');
	const migrationPlanPath = resolve(runArgs.resolvedOutDir, 'migration-plan.json');

	await writeJsonFile(deterministicSnapshotPath, artifacts.deterministicSnapshot);
	await writeJsonFile(idMappingPlanPath, artifacts.idMappingPlan);
	await writeJsonFile(targetReportPath, artifacts.targetReport);
	await writeJsonFile(migrationPlanPath, artifacts.migrationPlan);

	process.stdout.write(
		[
			`Wrote deterministic snapshot: ${deterministicSnapshotPath}`,
			`Wrote ID mapping plan: ${idMappingPlanPath}`,
			`Wrote guardrail target report: ${targetReportPath}`,
			`Wrote migration plan: ${migrationPlanPath}`
		].join('\n') + '\n'
	);

	if (!artifacts.migrationPlan.readiness.ok && !runArgs.allowBlockers) {
		logBlockersAndSetExitCode(artifacts.migrationPlan.readiness.blockers);
	}
};

const assertApplyConfirmation = (account: MigrationAccount, args: CliArgs) => {
	const confirmation = asString(args.confirm);
	const expected = account === 'prod' ? 'apply-prod' : 'apply-dev';
	if (confirmation !== expected) {
		throw new Error(`Apply mode requires \`--confirm ${expected}\`.`);
	}
};

const runApplyMode = async (args: CliArgs) => {
	const runArgs = await parseCommonRunArgs(args);
	assertApplyConfirmation(runArgs.account, args);

	const targetAccountSecret = asString(args['target-account-secret']) ?? asString(process.env.JAZZ_WORKER_SECRET);
	if (!targetAccountSecret) {
		throw new Error('`--target-account-secret` is required for apply mode (or set JAZZ_WORKER_SECRET).');
	}

	const syncServer =
		asString(args['sync-server']) ??
		asString(process.env.PUBLIC_JAZZ_SYNC_URL) ??
		'wss://cloud.jazz.tools';

	const snapshotJson = await loadJsonFile<unknown>(runArgs.resolvedSnapshotPath);
	const rowsByTable = extractSnapshotRowsByTable(snapshotJson);
	const planArtifacts = createConvexToJazzMigrationPlanArtifacts({
		account: runArgs.account,
		sourceUserId: runArgs.sourceUserId,
		targetAccountId: runArgs.targetAccountId,
		rowsByTable,
		generatedAt: runArgs.generatedAt
	});

	const deterministicSnapshotPath = resolve(
		runArgs.resolvedOutDir,
		'convex-deterministic-export.json'
	);
	const idMappingPlanPath = resolve(runArgs.resolvedOutDir, 'id-map-plan.json');
	await writeJsonFile(deterministicSnapshotPath, planArtifacts.deterministicSnapshot);
	await writeJsonFile(idMappingPlanPath, planArtifacts.idMappingPlan);

	if (!planArtifacts.migrationPlan.readiness.ok && !runArgs.allowBlockers) {
		logBlockersAndSetExitCode(planArtifacts.migrationPlan.readiness.blockers);
		return;
	}

	const workerSession = await startWorker({
		accountID: runArgs.targetAccountId,
		accountSecret: targetAccountSecret,
		syncServer,
		AccountSchema: JazzAccount,
		asActiveAccount: false
	});

	try {
		await workerSession.waitForConnection();
		const applyResult = await applyDeterministicSnapshotToJazzAccount({
			worker: workerSession.worker as never,
			deterministicSnapshot: planArtifacts.deterministicSnapshot
		});

		const targetReportPath = resolve(runArgs.resolvedOutDir, 'target-report.json');
		const appliedIdMapPath = resolve(runArgs.resolvedOutDir, 'id-map-actual.json');
		const migrationPlanPath = resolve(runArgs.resolvedOutDir, 'migration-plan.json');
		const applyReportPath = resolve(runArgs.resolvedOutDir, 'migration-apply-report.json');

		const applyReport = {
			schemaVersion: 1,
			mode: 'apply',
			appliedAt: new Date().toISOString(),
			account: runArgs.account,
			sourceUserId: runArgs.sourceUserId,
			targetAccountId: runArgs.targetAccountId,
			syncServer,
			atomicImportSemantics: 'full-replace-root-switch',
			planReadiness: planArtifacts.migrationPlan.readiness,
			rootSwitch: applyResult.rootSwitch
		};

		await writeJsonFile(targetReportPath, applyResult.targetReport);
		await writeJsonFile(appliedIdMapPath, applyResult.appliedIdMappingByTable);
		await writeJsonFile(migrationPlanPath, planArtifacts.migrationPlan);
		await writeJsonFile(applyReportPath, applyReport);

		process.stdout.write(
			[
				`Wrote deterministic snapshot: ${deterministicSnapshotPath}`,
				`Wrote planned ID map: ${idMappingPlanPath}`,
				`Wrote applied ID map: ${appliedIdMapPath}`,
				`Wrote target report: ${targetReportPath}`,
				`Wrote migration plan: ${migrationPlanPath}`,
				`Wrote apply report: ${applyReportPath}`
			].join('\n') + '\n'
		);

		const baselinePath = asString(args.baseline);
		if (baselinePath) {
			const guardrailOut =
				asString(args['guardrail-out']) ??
				resolve(runArgs.resolvedOutDir, 'guardrail-report.json');
			const baseline = await loadJsonFile<ConvexBaselineSnapshot>(baselinePath);
			const evaluation = evaluatePreflightRun({
				baseline,
				targetCounts: applyResult.targetReport.targetCounts,
				referentialChecks: applyResult.targetReport.referentialChecks,
				invariantChecks: applyResult.targetReport.invariantChecks,
				smokeChecks: applyResult.targetReport.smokeChecks
			});
			await writeJsonFile(guardrailOut, evaluation);
			process.stdout.write(`Wrote guardrail evaluation: ${resolve(guardrailOut)}\n`);

			if (evaluation.abort.shouldAbort) {
				process.exitCode = 1;
			}
		}
	} finally {
		await workerSession.shutdownWorker();
	}
};

const main = async () => {
	const [mode, ...rest] = process.argv.slice(2);
	if (mode !== 'plan' && mode !== 'apply') {
		throw new Error(usage);
	}

	const args = parseArgs(rest);
	if (mode === 'plan') {
		await runPlanMode(args);
		return;
	}

	await runApplyMode(args);
};

main().catch((error: unknown) => {
	const message = error instanceof Error ? error.message : String(error);
	console.error(message);
	console.error('\n' + usage);
	process.exit(1);
});
