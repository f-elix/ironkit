import { readFileSync } from 'fs';
import { resolve } from 'path';
import { startWorker } from 'jazz-tools/worker';
import {
	IronkitAccount,
	Exercise,
	Workout,
	PerformanceGroup,
	Performance,
	PerformanceSet
} from '../src/lib/jazz/schema';

export type EntityType =
	| 'exercises'
	| 'workouts'
	| 'performanceGroups'
	| 'performances'
	| 'performanceSets';

export interface BaseRecord {
	_id: string;
	_creationTime: number;
	userId: string;
}

export interface ExerciseRecord extends BaseRecord {
	name: string;
	executionType: 'reps' | 'time';
	loadType: 'weighted' | 'bodyweight';
	muscleGroups: string[];
	updatedAt: number;
}

export interface WorkoutRecord extends BaseRecord {
	title: string;
	date: number;
	notes?: string;
	bodyweight?: number;
	bodyweightUnit: 'lbs' | 'kg';
	updatedAt: number;
}

export interface PerformanceGroupRecord extends BaseRecord {
	workoutId: string;
	label?: string;
	workoutOrder: number;
	updatedAt: number;
}

export interface PerformanceRecord extends BaseRecord {
	performanceGroupId: string;
	exerciseId: string;
	weightUnit: 'lbs' | 'kg';
	groupOrder: number;
	workoutId: string;
	note?: string;
	updatedAt: number;
}

export interface PerformanceSetRecord extends BaseRecord {
	performanceId: string;
	weight?: number;
	reps?: number;
	durationSeconds?: number;
	note?: string;
	performanceOrder: number;
	updatedAt: number;
}

export type EntityRecord<T extends EntityType> = T extends 'exercises'
	? ExerciseRecord
	: T extends 'workouts'
		? WorkoutRecord
		: T extends 'performanceGroups'
			? PerformanceGroupRecord
			: T extends 'performances'
				? PerformanceRecord
				: T extends 'performanceSets'
					? PerformanceSetRecord
					: never;

const CONVEX_DATA_DIR = resolve(process.cwd(), 'convex-data');

export function loadConvexData<T extends EntityType>(entity: T): EntityRecord<T>[] {
	const filePath = resolve(CONVEX_DATA_DIR, entity, 'documents.jsonl');

	try {
		const content = readFileSync(filePath, 'utf-8');
		const lines = content.trim().split('\n');

		const records: EntityRecord<T>[] = [];
		let errorCount = 0;

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i].trim();
			if (!line) continue;

			try {
				const record = JSON.parse(line) as EntityRecord<T>;
				records.push(record);
			} catch (parseError) {
				errorCount++;
				console.error(`[loadConvexData] Invalid JSON at line ${i + 1} in ${entity}:`, parseError);
			}
		}

		if (errorCount > 0) {
			console.warn(
				`[loadConvexData] Loaded ${records.length} records from ${entity} with ${errorCount} parse errors`
			);
		} else {
			console.log(`[loadConvexData] Loaded ${records.length} records from ${entity}`);
		}

		return records;
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
			console.error(`[loadConvexData] File not found: ${filePath}`);
			return [];
		}
		throw error;
	}
}

export function filterByUser<T extends BaseRecord>(records: T[], userId: string): T[] {
	return records.filter((record) => record.userId === userId);
}

export interface JazzWorkerSession {
	worker: Awaited<ReturnType<typeof startWorker<typeof IronkitAccount>>>['worker'];
	shutdown: () => Promise<void>;
	waitForConnection: () => Promise<void>;
	waitForSync: () => Promise<void>;
}

const CONNECTION_TIMEOUT_MS = 30000;
const CONNECTION_RETRY_DELAY_MS = 1000;
const MAX_RETRIES = 3;

export async function connectAsUser(): Promise<JazzWorkerSession> {
	const accountId = process.env.JAZZ_MIGRATION_ACCOUNT_ID;
	const accountSecret = process.env.JAZZ_MIGRATION_ACCOUNT_SECRET;

	if (!accountId) {
		throw new Error(
			'Missing JAZZ_MIGRATION_ACCOUNT_ID environment variable. ' +
				'Please set it to the Jazz account ID for migration.'
		);
	}

	if (!accountSecret) {
		throw new Error(
			'Missing JAZZ_MIGRATION_ACCOUNT_SECRET environment variable. ' +
				'Please set it to the Jazz account secret for migration.'
		);
	}

	if (!accountId.startsWith('co_')) {
		throw new Error(
			`Invalid JAZZ_MIGRATION_ACCOUNT_ID: "${accountId}". ` + 'Account ID must start with "co_".'
		);
	}

	if (!accountSecret.startsWith('sealerSecret_')) {
		throw new Error(
			`Invalid JAZZ_MIGRATION_ACCOUNT_SECRET: must start with "sealerSecret_". ` +
				'Ensure you are using the full secret key.'
		);
	}

	let lastError: Error | undefined;

	for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
		try {
			console.log(`[connectAsUser] Connecting to Jazz (attempt ${attempt}/${MAX_RETRIES})...`);

			const session = await Promise.race([
				startWorker({
					accountID: accountId,
					accountSecret: accountSecret,
					AccountSchema: IronkitAccount
				}),
				new Promise<never>((_, reject) => {
					setTimeout(
						() => reject(new Error(`Connection timeout after ${CONNECTION_TIMEOUT_MS}ms`)),
						CONNECTION_TIMEOUT_MS
					);
				})
			]);

			console.log(
				`[connectAsUser] Connected successfully to Jazz account: ${(session.worker as unknown as { $jazz: { id: string } }).$jazz.id}`
			);

			return {
				worker: session.worker,
				shutdown: session.shutdownWorker,
				waitForConnection: session.waitForConnection,
				waitForSync: async () => {
					console.log('[waitForSync] Waiting for all CoValues to sync...');
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					await (session.worker as any).$jazz.waitForAllCoValuesSync();
					console.log('[waitForSync] All CoValues synced successfully');
				}
			};
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));
			console.error(`[connectAsUser] Connection attempt ${attempt} failed:`, lastError.message);

			if (attempt < MAX_RETRIES) {
				console.log(`[connectAsUser] Retrying in ${CONNECTION_RETRY_DELAY_MS}ms...`);
				await new Promise((resolve) => setTimeout(resolve, CONNECTION_RETRY_DELAY_MS));
			}
		}
	}

	throw new Error(
		`Failed to connect to Jazz after ${MAX_RETRIES} attempts. ` +
			`Last error: ${lastError?.message}`
	);
}

export interface MigrationResult<T> {
	created: T[];
	duplicates: number;
	errors: number;
}

export interface ValidationResult {
	entity: EntityType;
	loaded: number;
	created: number;
	skipped: number;
	errors: number;
	passed: boolean;
}

export interface MigrationError {
	entity: EntityType;
	recordId: string;
	message: string;
	timestamp: Date;
}

export interface MigrationSummary {
	startTime: Date;
	endTime: Date;
	errors: MigrationError[];
	validationResults: ValidationResult[];
	totalLoaded: number;
	totalCreated: number;
	totalSkipped: number;
	totalErrors: number;
}

export function validateMigrationCounts(
	entity: EntityType,
	loaded: number,
	created: number,
	skipped: number,
	errors: number
): ValidationResult {
	const expected = loaded;
	const actual = created + skipped + errors;
	const passed = expected === actual;

	return {
		entity,
		loaded,
		created,
		skipped,
		errors,
		passed
	};
}

export function logValidationResults(results: ValidationResult[]): void {
	console.log('\n=== Data Integrity Validation ===\n');

	let allPassed = true;

	for (const result of results) {
		const status = result.passed ? 'PASS' : 'FAIL';
		console.log(`[${status}] ${result.entity}:`);
		console.log(`  Loaded:  ${result.loaded}`);
		console.log(`  Created: ${result.created}`);
		console.log(`  Skipped: ${result.skipped}`);
		console.log(`  Errors:  ${result.errors}`);
		console.log(`  Total:   ${result.created + result.skipped + result.errors} / ${result.loaded}`);
		console.log('');

		if (!result.passed) {
			allPassed = false;
		}
	}

	if (allPassed) {
		console.log('All validations passed!');
	} else {
		console.error(
			'VALIDATION FAILED: Some counts do not match. Review skipped records and errors above.'
		);
		process.exit(1);
	}
}

export function logMigrationSummary(summary: MigrationSummary): void {
	const duration = summary.endTime.getTime() - summary.startTime.getTime();
	const durationSeconds = (duration / 1000).toFixed(2);

	console.log('\n=== Migration Summary ===\n');
	console.log(`Duration: ${durationSeconds}s`);
	console.log(`Total Records: ${summary.totalLoaded}`);
	console.log(`  Created: ${summary.totalCreated}`);
	console.log(`  Skipped: ${summary.totalSkipped}`);
	console.log(`  Errors:  ${summary.totalErrors}`);
	console.log('');

	const hasErrors = summary.totalErrors > 0;
	const hasSkips = summary.totalSkipped > 0;

	if (hasErrors && hasSkips) {
		console.warn(
			'Migration completed with errors and skipped records. Review logs above for details.'
		);
	} else if (hasErrors) {
		console.warn('Migration completed with errors. Review logs above for details.');
	} else if (hasSkips) {
		console.log(
			'Migration completed with some skipped records (duplicates or missing references).'
		);
	} else {
		console.log('Migration completed successfully with no errors or skips!');
	}
}

export interface MigrateExercisesResult {
	map: Map<string, ReturnType<typeof Exercise.create>>;
	created: number;
	duplicates: number;
	errors: number;
}

export async function migrateExercises(
	worker: JazzWorkerSession['worker'],
	exercises: ExerciseRecord[]
): Promise<MigrateExercisesResult> {
	console.log(`[migrateExercises] Starting migration of ${exercises.length} exercises...`);

	const exerciseMap = new Map<string, ReturnType<typeof Exercise.create>>();
	const seenNames = new Set<string>();
	let duplicateCount = 0;
	let errorCount = 0;

	// Ensure the worker account is fully loaded with resolved references
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const loadedWorker = await (worker as any).$jazz.ensureLoaded({
		resolve: {
			root: {
				exercises: { $each: true }
			}
		}
	});
	const accountRoot = loadedWorker.root;

	for (const record of exercises) {
		try {
			if (seenNames.has(record.name)) {
				console.warn(`[migrateExercises] Skipping duplicate exercise by name: "${record.name}"`);
				duplicateCount++;
				continue;
			}

			const jazzExercise = Exercise.create({
				name: record.name,
				executionType: record.executionType,
				loadType: record.loadType,
				muscleGroups: record.muscleGroups ?? []
			});

			accountRoot.exercises.$jazz.push(jazzExercise);
			exerciseMap.set(record._id, jazzExercise);
			seenNames.add(record.name);
		} catch (error) {
			errorCount++;
			console.error(`[migrateExercises] Failed to create exercise "${record.name}":`, error);
		}
	}

	console.log(
		`[migrateExercises] Created ${exerciseMap.size} exercises ` +
			`(${duplicateCount} duplicates skipped, ${errorCount} errors)`
	);

	return {
		map: exerciseMap,
		created: exerciseMap.size,
		duplicates: duplicateCount,
		errors: errorCount
	};
}

export interface MigrateWorkoutsResult {
	map: Map<string, ReturnType<typeof Workout.create>>;
	created: number;
	errors: number;
}

export async function migrateWorkouts(
	worker: JazzWorkerSession['worker'],
	workouts: WorkoutRecord[]
): Promise<MigrateWorkoutsResult> {
	console.log(`[migrateWorkouts] Starting migration of ${workouts.length} workouts...`);

	const workoutMap = new Map<string, ReturnType<typeof Workout.create>>();
	let errorCount = 0;

	// Ensure the worker account is fully loaded with resolved references
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const loadedWorker = await (worker as any).$jazz.ensureLoaded({
		resolve: {
			root: {
				workouts: { $each: true }
			}
		}
	});
	const accountRoot = loadedWorker.root;

	for (const record of workouts) {
		try {
			const jazzWorkout = Workout.create({
				title: record.title,
				date: new Date(record.date),
				notes: record.notes,
				bodyweight: record.bodyweight,
				bodyweightUnit: record.bodyweightUnit,
				performanceGroups: []
			});

			accountRoot.workouts.$jazz.push(jazzWorkout);
			workoutMap.set(record._id, jazzWorkout);
		} catch (error) {
			errorCount++;
			console.error(
				`[migrateWorkouts] Failed to create workout "${record.title}" (${record._id}):`,
				error
			);
		}
	}

	console.log(`[migrateWorkouts] Created ${workoutMap.size} workouts ` + `(${errorCount} errors)`);

	return {
		map: workoutMap,
		created: workoutMap.size,
		errors: errorCount
	};
}

export interface MigratePerformanceGroupsResult {
	map: Map<string, ReturnType<typeof PerformanceGroup.create>>;
	created: number;
	skipped: number;
	errors: number;
}

export async function migratePerformanceGroups(
	worker: JazzWorkerSession['worker'],
	performanceGroups: PerformanceGroupRecord[],
	workoutMap: Map<string, ReturnType<typeof Workout.create>>
): Promise<MigratePerformanceGroupsResult> {
	console.log(
		`[migratePerformanceGroups] Starting migration of ${performanceGroups.length} performance groups...`
	);

	const performanceGroupMap = new Map<string, ReturnType<typeof PerformanceGroup.create>>();
	let errorCount = 0;
	let skippedCount = 0;

	// Ensure the worker account is fully loaded with resolved references (including nested workout performanceGroups)
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const loadedWorker = await (worker as any).$jazz.ensureLoaded({
		resolve: {
			root: {
				workouts: {
					$each: {
						performanceGroups: { $each: true }
					}
				}
			}
		}
	});

	// Rebuild workout map from loaded worker to get resolved CoValues
	const loadedWorkoutMap = new Map<string, ReturnType<typeof Workout.create>>();
	for (const [id, workout] of workoutMap) {
		// Find the corresponding loaded workout by matching the CoValue ID
		const loadedWorkout = loadedWorker.root.workouts.find(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(w: any) => w.$jazz.id === (workout as unknown as { $jazz: { id: string } }).$jazz.id
		);
		if (loadedWorkout) {
			loadedWorkoutMap.set(id, loadedWorkout);
		}
	}

	// Group performance groups by workoutId for efficient processing
	const groupsByWorkoutId = new Map<string, PerformanceGroupRecord[]>();
	for (const record of performanceGroups) {
		const list = groupsByWorkoutId.get(record.workoutId) ?? [];
		list.push(record);
		groupsByWorkoutId.set(record.workoutId, list);
	}

	// Process each workout's performance groups
	for (const [workoutId, groups] of groupsByWorkoutId) {
		const jazzWorkout = loadedWorkoutMap.get(workoutId);
		if (!jazzWorkout) {
			console.warn(
				`[migratePerformanceGroups] Workout not found for ID: ${workoutId}, skipping ${groups.length} performance groups`
			);
			skippedCount += groups.length;
			continue;
		}

		// Sort by workoutOrder
		const sortedGroups = groups.sort((a, b) => a.workoutOrder - b.workoutOrder);

		for (const record of sortedGroups) {
			try {
				const jazzPerformanceGroup = PerformanceGroup.create({
					label: record.label,
					workoutOrder: record.workoutOrder,
					performances: []
				});

				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(jazzWorkout.performanceGroups as any).$jazz.push(jazzPerformanceGroup);
				performanceGroupMap.set(record._id, jazzPerformanceGroup);
			} catch (error) {
				errorCount++;
				console.error(
					`[migratePerformanceGroups] Failed to create performance group for workout ${workoutId}:`,
					error
				);
			}
		}
	}

	console.log(
		`[migratePerformanceGroups] Created ${performanceGroupMap.size} performance groups ` +
			`(${skippedCount} skipped due to missing workout, ${errorCount} errors)`
	);

	return {
		map: performanceGroupMap,
		created: performanceGroupMap.size,
		skipped: skippedCount,
		errors: errorCount
	};
}

export interface MigratePerformancesResult {
	map: Map<string, ReturnType<typeof Performance.create>>;
	created: number;
	skipped: number;
	skippedMissingExercise: number;
	errors: number;
}

export async function migratePerformances(
	worker: JazzWorkerSession['worker'],
	performances: PerformanceRecord[],
	exerciseMap: Map<string, ReturnType<typeof Exercise.create>>,
	performanceGroupMap: Map<string, ReturnType<typeof PerformanceGroup.create>>
): Promise<MigratePerformancesResult> {
	console.log(`[migratePerformances] Starting migration of ${performances.length} performances...`);

	const performanceMap = new Map<string, ReturnType<typeof Performance.create>>();
	let errorCount = 0;
	let skippedCount = 0;
	let missingExerciseCount = 0;

	// Ensure the worker account is fully loaded with resolved references
	// We need to resolve the full nested structure: workouts -> performanceGroups -> performances
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const loadedWorker = await (worker as any).$jazz.ensureLoaded({
		resolve: {
			root: {
				workouts: {
					$each: {
						performanceGroups: {
							$each: {
								performances: { $each: true }
							}
						}
					}
				}
			}
		}
	});

	// Rebuild performance group map from loaded worker
	const loadedPerformanceGroupMap = new Map<string, ReturnType<typeof PerformanceGroup.create>>();
	for (const [id, group] of performanceGroupMap) {
		// Find the corresponding loaded group by matching the CoValue ID
		for (const workout of loadedWorker.root.workouts) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const loadedGroup = workout.performanceGroups.find(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(g: any) => g.$jazz.id === (group as unknown as { $jazz: { id: string } }).$jazz.id
			);
			if (loadedGroup) {
				loadedPerformanceGroupMap.set(id, loadedGroup);
				break;
			}
		}
	}

	// Group performances by performanceGroupId for efficient processing
	const performancesByGroupId = new Map<string, PerformanceRecord[]>();
	for (const record of performances) {
		const list = performancesByGroupId.get(record.performanceGroupId) ?? [];
		list.push(record);
		performancesByGroupId.set(record.performanceGroupId, list);
	}

	// Process each performance group's performances
	for (const [performanceGroupId, groupPerformances] of performancesByGroupId) {
		const jazzPerformanceGroup = loadedPerformanceGroupMap.get(performanceGroupId);
		if (!jazzPerformanceGroup) {
			console.warn(
				`[migratePerformances] PerformanceGroup not found for ID: ${performanceGroupId}, ` +
					`skipping ${groupPerformances.length} performances`
			);
			skippedCount += groupPerformances.length;
			continue;
		}

		// Sort by groupOrder
		const sortedPerformances = groupPerformances.sort((a, b) => a.groupOrder - b.groupOrder);

		for (const record of sortedPerformances) {
			try {
				// Look up the exercise reference
				const jazzExercise = exerciseMap.get(record.exerciseId);
				if (!jazzExercise) {
					console.error(
						`[migratePerformances] Exercise not found for ID: ${record.exerciseId}, ` +
							`skipping performance ${record._id}`
					);
					missingExerciseCount++;
					continue;
				}

				const jazzPerformance = Performance.create({
					performanceGroupId: record.performanceGroupId,
					exercise: jazzExercise,
					groupOrder: record.groupOrder,
					note: record.note,
					weightUnit: record.weightUnit,
					performanceSets: []
				});

				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(jazzPerformanceGroup.performances as any).$jazz.push(jazzPerformance);
				performanceMap.set(record._id, jazzPerformance);
			} catch (error) {
				errorCount++;
				console.error(
					`[migratePerformances] Failed to create performance for group ${performanceGroupId}:`,
					error
				);
			}
		}
	}

	console.log(
		`[migratePerformances] Created ${performanceMap.size} performances ` +
			`(${skippedCount} skipped due to missing group, ${missingExerciseCount} skipped due to missing exercise, ` +
			`${errorCount} errors)`
	);

	return {
		map: performanceMap,
		created: performanceMap.size,
		skipped: skippedCount,
		skippedMissingExercise: missingExerciseCount,
		errors: errorCount
	};
}

export interface MigratePerformanceSetsResult {
	map: Map<string, ReturnType<typeof PerformanceSet.create>>;
	created: number;
	skipped: number;
	errors: number;
}

export async function migratePerformanceSets(
	worker: JazzWorkerSession['worker'],
	performanceSets: PerformanceSetRecord[],
	performanceMap: Map<string, ReturnType<typeof Performance.create>>
): Promise<MigratePerformanceSetsResult> {
	console.log(
		`[migratePerformanceSets] Starting migration of ${performanceSets.length} performance sets...`
	);

	const performanceSetMap = new Map<string, ReturnType<typeof PerformanceSet.create>>();
	let errorCount = 0;
	let skippedCount = 0;

	// Ensure the worker account is fully loaded with resolved references
	// We need to resolve the full nested structure down to performanceSets
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const loadedWorker = await (worker as any).$jazz.ensureLoaded({
		resolve: {
			root: {
				workouts: {
					$each: {
						performanceGroups: {
							$each: {
								performances: {
									$each: {
										performanceSets: { $each: true }
									}
								}
							}
						}
					}
				}
			}
		}
	});

	// Rebuild performance map from loaded worker
	const loadedPerformanceMap = new Map<string, ReturnType<typeof Performance.create>>();
	for (const [id, performance] of performanceMap) {
		// Find the corresponding loaded performance by matching the CoValue ID
		for (const workout of loadedWorker.root.workouts) {
			for (const group of workout.performanceGroups) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const loadedPerf = group.performances.find(
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(p: any) => p.$jazz.id === (performance as unknown as { $jazz: { id: string } }).$jazz.id
				);
				if (loadedPerf) {
					loadedPerformanceMap.set(id, loadedPerf);
					break;
				}
			}
			if (loadedPerformanceMap.has(id)) break;
		}
	}

	// Group performance sets by performanceId for efficient processing
	const setsByPerformanceId = new Map<string, PerformanceSetRecord[]>();
	for (const record of performanceSets) {
		const list = setsByPerformanceId.get(record.performanceId) ?? [];
		list.push(record);
		setsByPerformanceId.set(record.performanceId, list);
	}

	// Process each performance's sets
	for (const [performanceId, sets] of setsByPerformanceId) {
		const jazzPerformance = loadedPerformanceMap.get(performanceId);
		if (!jazzPerformance) {
			console.warn(
				`[migratePerformanceSets] Performance not found for ID: ${performanceId}, ` +
					`skipping ${sets.length} performance sets`
			);
			skippedCount += sets.length;
			continue;
		}

		// Sort by performanceOrder
		const sortedSets = sets.sort((a, b) => a.performanceOrder - b.performanceOrder);

		for (const record of sortedSets) {
			try {
				const jazzPerformanceSet = PerformanceSet.create({
					weight: record.weight,
					reps: record.reps,
					durationSeconds: record.durationSeconds,
					note: record.note,
					performanceOrder: record.performanceOrder
				});

				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(jazzPerformance.performanceSets as any).$jazz.push(jazzPerformanceSet);
				performanceSetMap.set(record._id, jazzPerformanceSet);
			} catch (error) {
				errorCount++;
				console.error(
					`[migratePerformanceSets] Failed to create performance set for performance ${performanceId}:`,
					error
				);
			}
		}
	}

	console.log(
		`[migratePerformanceSets] Created ${performanceSetMap.size} performance sets ` +
			`(${skippedCount} skipped due to missing performance, ${errorCount} errors)`
	);

	return {
		map: performanceSetMap,
		created: performanceSetMap.size,
		skipped: skippedCount,
		errors: errorCount
	};
}

export async function clearAccountRoot(worker: JazzWorkerSession['worker']): Promise<void> {
	console.log('[clearAccountRoot] Clearing existing data from account root...');

	// Ensure the worker account is fully loaded with all lists resolved
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const loadedWorker = await (worker as any).$jazz.ensureLoaded({
		resolve: {
			root: {
				exercises: { $each: true },
				workouts: { $each: true },
				programTemplates: { $each: true },
				programRuns: { $each: true }
			}
		}
	});

	const accountRoot = loadedWorker.root;

	// Clear exercises
	const exerciseCount = accountRoot.exercises.length;
	if (exerciseCount > 0) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(accountRoot.exercises as any).$jazz.splice(0, exerciseCount);
		console.log(`[clearAccountRoot] Cleared ${exerciseCount} exercises`);
	}

	// Clear workouts
	const workoutCount = accountRoot.workouts.length;
	if (workoutCount > 0) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(accountRoot.workouts as any).$jazz.splice(0, workoutCount);
		console.log(`[clearAccountRoot] Cleared ${workoutCount} workouts`);
	}

	// Clear program templates
	const templateCount = accountRoot.programTemplates?.length ?? 0;
	if (templateCount > 0) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(accountRoot.programTemplates as any).$jazz.splice(0, templateCount);
		console.log(`[clearAccountRoot] Cleared ${templateCount} program templates`);
	}

	// Clear program runs
	const runCount = accountRoot.programRuns?.length ?? 0;
	if (runCount > 0) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(accountRoot.programRuns as any).$jazz.splice(0, runCount);
		console.log(`[clearAccountRoot] Cleared ${runCount} program runs`);
	}

	console.log('[clearAccountRoot] Account root cleared successfully');
}

export async function runMigration(userId?: string): Promise<void> {
	const startTime = new Date();
	console.log('=== Jazz Migration from Convex Export ===\n');
	console.log(`[runMigration] Started at ${startTime.toISOString()}\n`);

	// Validate environment
	if (!process.env.JAZZ_MIGRATION_ACCOUNT_ID || !process.env.JAZZ_MIGRATION_ACCOUNT_SECRET) {
		console.error('Error: JAZZ_MIGRATION_ACCOUNT_ID and JAZZ_MIGRATION_ACCOUNT_SECRET must be set');
		process.exit(1);
	}

	// Validate convex-data directory exists
	try {
		const { statSync } = await import('fs');
		statSync(CONVEX_DATA_DIR);
	} catch {
		console.error(`Error: convex-data directory not found at ${CONVEX_DATA_DIR}`);
		process.exit(1);
	}

	// Load all data
	console.log('[runMigration] Loading data from Convex export...');
	const allExercises = loadConvexData('exercises');
	const allWorkouts = loadConvexData('workouts');
	const allPerformanceGroups = loadConvexData('performanceGroups');
	const allPerformances = loadConvexData('performances');
	const allPerformanceSets = loadConvexData('performanceSets');

	// Filter by user if specified
	const targetUserId = userId || process.env.JAZZ_MIGRATION_USER_ID;
	const exercises = targetUserId ? filterByUser(allExercises, targetUserId) : allExercises;
	const workouts = targetUserId ? filterByUser(allWorkouts, targetUserId) : allWorkouts;
	const performanceGroups = targetUserId
		? filterByUser(allPerformanceGroups, targetUserId)
		: allPerformanceGroups;
	const performances = targetUserId ? filterByUser(allPerformances, targetUserId) : allPerformances;
	const performanceSets = targetUserId
		? filterByUser(allPerformanceSets, targetUserId)
		: allPerformanceSets;

	console.log(
		`[runMigration] Filtered to target user: ${exercises.length} exercises, ${workouts.length} workouts`
	);

	// Connect to Jazz
	console.log('[runMigration] Connecting to Jazz...');
	const session = await connectAsUser();
	await session.waitForConnection();

	try {
		// Clear existing data from account root for atomic migration
		await clearAccountRoot(session.worker);
		console.log('');

		// Run migrations and collect results
		console.log('\n[runMigration] Starting migrations...\n');

		const exerciseResult = await migrateExercises(session.worker, exercises);
		const workoutResult = await migrateWorkouts(session.worker, workouts);
		const performanceGroupResult = await migratePerformanceGroups(
			session.worker,
			performanceGroups,
			workoutResult.map
		);
		const performanceResult = await migratePerformances(
			session.worker,
			performances,
			exerciseResult.map,
			performanceGroupResult.map
		);
		const performanceSetResult = await migratePerformanceSets(
			session.worker,
			performanceSets,
			performanceResult.map
		);

		// Validate counts
		const validationResults: ValidationResult[] = [
			validateMigrationCounts(
				'exercises',
				exercises.length,
				exerciseResult.created,
				exerciseResult.duplicates,
				exerciseResult.errors
			),
			validateMigrationCounts(
				'workouts',
				workouts.length,
				workoutResult.created,
				0,
				workoutResult.errors
			),
			validateMigrationCounts(
				'performanceGroups',
				performanceGroups.length,
				performanceGroupResult.created,
				performanceGroupResult.skipped,
				performanceGroupResult.errors
			),
			validateMigrationCounts(
				'performances',
				performances.length,
				performanceResult.created,
				performanceResult.skipped + performanceResult.skippedMissingExercise,
				performanceResult.errors
			),
			validateMigrationCounts(
				'performanceSets',
				performanceSets.length,
				performanceSetResult.created,
				performanceSetResult.skipped,
				performanceSetResult.errors
			)
		];

		logValidationResults(validationResults);

		// Wait for Jazz sync before completing
		console.log('\n[runMigration] Waiting for Jazz sync...');
		await session.waitForSync();

		// Log completion summary
		logMigrationSummary({
			startTime,
			endTime: new Date(),
			validationResults,
			totalLoaded:
				exercises.length +
				workouts.length +
				performanceGroups.length +
				performances.length +
				performanceSets.length,
			totalCreated:
				exerciseResult.created +
				workoutResult.created +
				performanceGroupResult.created +
				performanceResult.created +
				performanceSetResult.created,
			totalSkipped:
				exerciseResult.duplicates +
				performanceGroupResult.skipped +
				performanceResult.skipped +
				performanceResult.skippedMissingExercise +
				performanceSetResult.skipped,
			totalErrors:
				exerciseResult.errors +
				workoutResult.errors +
				performanceGroupResult.errors +
				performanceResult.errors +
				performanceSetResult.errors,
			errors: [] // Individual errors are logged during migration
		});

		console.log('[runMigration] Migration completed successfully!');
	} finally {
		await session.shutdown();
	}
}

if (import.meta.main) {
	// Check if we should run full migration or just test loader
	if (process.env.JAZZ_MIGRATION_ACCOUNT_ID && process.env.JAZZ_MIGRATION_ACCOUNT_SECRET) {
		// Run full migration with validation
		runMigration().catch((error) => {
			console.error('[main] Migration failed:', error);
			process.exit(1);
		});
	} else {
		// Just test the JSONL loader
		console.log('Testing JSONL loader (env vars not set, skipping full migration)...\n');

		const exercises = loadConvexData('exercises');
		console.log(`Loaded ${exercises.length} exercises`);
		if (exercises.length > 0) {
			console.log('Sample exercise:', exercises[0]);
		}

		const workouts = loadConvexData('workouts');
		console.log(`Loaded ${workouts.length} workouts`);

		const performanceGroups = loadConvexData('performanceGroups');
		console.log(`Loaded ${performanceGroups.length} performance groups`);

		const performances = loadConvexData('performances');
		console.log(`Loaded ${performances.length} performances`);

		const performanceSets = loadConvexData('performanceSets');
		console.log(`Loaded ${performanceSets.length} performance sets`);

		const testUserId = 'k97b4zeqr4ztcpk2x6q3z4jqfs7spxvx';
		const userExercises = filterByUser(exercises, testUserId);
		console.log(`\nFiltered to ${userExercises.length} exercises for user ${testUserId}`);

		console.log(
			'\nSet JAZZ_MIGRATION_ACCOUNT_ID and JAZZ_MIGRATION_ACCOUNT_SECRET to run full migration.'
		);
	}
}
