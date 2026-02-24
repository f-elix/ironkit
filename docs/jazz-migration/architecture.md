# Convex to Jazz Migration Architecture

## Goals

- Replace Convex persistence and Convex API calls with Jazz.
- Preserve behavior while expressing the same domain hierarchy in Jazz-native schema form.
- Keep Better Auth with Google login, migrated to Jazz-compatible account storage.
- Allow temporary breakage during implementation; restore end-to-end stability at final cutover.

## Non-goals

- Redesigning product behavior during migration.
- Progressive rollout, dual-backend operation, or backwards compatibility with Convex at runtime.

## Operating Assumptions

- This is a personal app with one operator.
- Two accounts exist:
  - `dev` for repeated migration rehearsal
  - `prod` for real data
- Final release is a single all-at-once cutover.
- Temporary runtime breakage during migration implementation is expected; only final cutover must be stable.

## Current State (Convex)

- Data model is table-based with explicit `userId` ownership and indexes.
- Frontend calls Convex query/mutation endpoints directly through generated API types.
- Better Auth runs with Convex adapter/plugin and Google provider.

## Target State (Jazz)

## Data Ownership Model

- Primary container: one user-owned root graph per account (for private training data).
- Performance-tracking data is modeled as a nested hierarchy for direct parent-first traversal:
  - `workout -> performanceGroups -> performances -> performanceSets`
  - `programTemplate -> programWorkouts -> performanceGroups -> performances -> programWorkoutExerciseTargets`
  - `programRun -> programRunSessions`
- Root-level account lists are: tools/preferences, `exercises`, `workouts`, `programTemplates`, and `programRuns`.

## Schema Shape (High Level)

```ts
import { co, z } from 'jazz-tools';

const Workout = co.map({
	title: z.string(),
	date: z.number(),
	get performanceGroups() {
		return co.list(PerformanceGroup);
	}
});

const PerformanceGroup = co.map({
	get workout() {
		return co.optional(Workout);
	},
	get programWorkout() {
		return co.optional(ProgramWorkout);
	},
	get performances() {
		return co.list(Performance);
	},
	workoutOrder: z.number()
});

const Performance = co.map({
	performanceGroup: PerformanceGroup,
	exercise: Exercise,
	get performanceSets() {
		return co.list(PerformanceSet);
	},
	get programWorkoutExerciseTargets() {
		return co.list(ProgramWorkoutExerciseTarget);
	},
	groupOrder: z.number()
});

const ProgramWorkoutExerciseTarget = co.map({
	performance: Performance,
	targetOrder: z.number()
});

const ProgramTemplate = co.map({
	get programWorkouts() {
		return co.list(ProgramWorkout);
	}
});

const ProgramWorkout = co.map({
	programTemplate: ProgramTemplate,
	get performanceGroups() {
		return co.list(PerformanceGroup);
	},
	weekNumber: z.number(),
	slotOrder: z.number()
});

const ProgramRun = co.map({
	programTemplate: ProgramTemplate,
	get programRunSessions() {
		return co.list(ProgramRunSession);
	}
});

const ProgramRunSession = co.map({
	programRun: ProgramRun,
	programWorkout: ProgramWorkout
});

const JazzUserSpace = co.map({
	weightConverter: co.list(WeightConverter),
	coefficientCalculator: co.list(CoefficientCalculator),
	loadPercentageCalculator: co.list(LoadPercentageCalculator),
	plateCalculator: co.list(PlateCalculator),
	exercises: co.list(Exercise),
	workouts: co.list(Workout),
	programTemplates: co.list(ProgramTemplate),
	programRuns: co.list(ProgramRun),
});
```

## Relationship and Invariants

Current schema modeling:

- Parent-first traversal for workout and program data is preserved, and child-to-parent references are also preserved for bidirectional access.
- `PerformanceGroup` supports dual ownership context via optional `workout` or optional `programWorkout` links, while parents keep ordered `performanceGroups` lists.
- `Performance` keeps `performanceGroup` and ordered `programWorkoutExerciseTargets`, while each target keeps `performance`.
- `ProgramRun` keeps `programRunSessions`, and each `ProgramRunSession` keeps `programRun`.
- Ordering guarantees:
  - template workout order by `weekNumber` + `slotOrder`
  - workout group order by `workoutOrder`
  - exercise order by `groupOrder`
  - set order by `performanceOrder` / `targetOrder`
- Guardrails:
  - cannot delete templates/workouts referenced by unfinished run sessions
  - only one active program run per user
  - program run completion is recomputed from open sessions

## Query Strategy

- Keep read/write patterns equivalent to Convex:
  - list by user, sorted by date/order
  - get by id with ownership checks
  - write methods with same validation/cascade behavior
- Maintain explicit derived ordering lists in Jazz where needed to avoid expensive full-graph scans for hot paths.
- No runtime Convex/Jazz switching or feature-flagged dual path is required.

## Implemented Guardrail Artifacts

- Machine-readable guardrail policy and evaluator:
  - `src/lib/jazz-migration/preflight-guardrails.ts`
- Operator CLI for baseline capture + gate evaluation:
  - `scripts/jazz-migration/preflight-guardrails.ts`
- Runbook for final cutover sequence, pass/fail gates, abort criteria, and rerun procedure:
  - `docs/jazz-migration/cutover-guardrails.md`
- Baseline/report artifact folder:
  - `docs/jazz-migration/baselines/`

## Auth Architecture (Better Auth + Jazz + Google)

- Keep Better Auth as the auth system and reuse Google provider config.
- Use a Jazz Better Auth client (`jazzPluginClient`) directly for Jazz auth provider wiring.
- Do not mix Convex auth client plugins with Jazz auth client plugins in the same Better Auth client setup.
- Keep Convex Better Auth server configuration unchanged for now; defer any server-side account backfill hooks to later migration steps if needed.
- Keep SvelteKit auth route pattern (`/api/auth/[...all]`) and use Jazz Svelte provider + Jazz Better Auth `AuthProvider` for Jazz auth context.

Reference used: [Jazz LLM docs](https://jazz.tools/llms-full.txt) (Better Auth plugin + migration APIs).

## Data Migration Architecture

Data migration is required before cutover because existing Convex data must be moved into Jazz.

## Export

- Script reads Convex data table-by-table using admin credentials.
- Output deterministic JSON files (or NDJSON) with:
  - source row payload
  - source `_id`
  - source table name
- Implemented planning utility:
  - `src/lib/jazz-migration/snapshot-utils.ts`
  - Supports snapshot extraction from either top-level table maps or `{ tables: ... }` shape.
  - Produces deterministic per-table row ordering to make reruns diffable/repeatable.

## Transform

- Normalize enums and optional fields to Jazz schema shape.
- Build mapping dictionaries:
  - `convexId -> jazzId`
  - `convexUserId -> jazzAccountId`
- Implemented dry-run planning artifacts:
  - `src/lib/jazz-migration/migration-plan.ts`
  - Builds:
    - deterministic export snapshot (`convex-deterministic-export.json`)
    - Convex `_id` to planned Jazz ID mapping (`id-map-plan.json`)
    - guardrail target report (`target-report.json`)
    - readiness summary (`migration-plan.json`)
  - CLI mode:
    - `node scripts/jazz-migration/run-migrate-convex-to-jazz.mjs plan ...`

## Import

- Import should use atomic full-replace semantics on every run.
- Strategy:
  - build a complete new Jazz account-root graph from snapshot data
  - perform all reference wiring and parity checks on that new graph
  - switch active root pointer only after successful build/validation
  - delete previous user-space graph after successful switch
- This ensures each execution is replace-all and avoids partial merge state.
- Import order within the new graph still follows topological phases:
  - independent entities (tool prefs, exercises, templates)
  - dependent graph nodes (program workouts/groups/exercises/targets, workouts/groups/performances/sets)
  - runs and sessions
  - second-pass patching for cyclic optional references (`workout.programRunSessionId` and `session.workoutId`)
- Current status:
  - Atomic import phases are documented and emitted in migration plans.
  - Live apply mode is implemented in `src/lib/jazz-migration/apply-import.ts` and wired in:
    - `node scripts/jazz-migration/run-migrate-convex-to-jazz.mjs apply ...`
  - Apply flow performs:
    - full replacement root graph build from deterministic rows
    - post-import guardrail target report build with rewritten Jazz IDs
    - account root pointer switch on success
    - previous-root deletion after successful switch

## Verification

- Parity report should include:
  - row counts per logical entity
  - referential integrity checks
- invariant checks (active run uniqueness, unfinished-session constraints)
- Implemented:
  - `target-report.json` generation wired through `createMigrationTargetReportFromSnapshotRows(...)` during dry-run planning.
  - `target-report.json` generation after real apply writes is wired through `createMigrationTargetReportFromEntityRows(...)`.
  - Dry-run planning command:

```bash
node scripts/jazz-migration/run-migrate-convex-to-jazz.mjs plan \
  --account dev \
  --snapshot /absolute/path/to/convex-snapshot.json \
  --source-user-id <convex-user-id> \
  --target-account-id <jazz-account-id> \
  --out-dir ./docs/jazz-migration/runs/dev-rehearsal
```

  - Apply command:

```bash
node scripts/jazz-migration/run-migrate-convex-to-jazz.mjs apply \
  --account dev \
  --snapshot /absolute/path/to/convex-snapshot.json \
  --source-user-id <convex-user-id> \
  --target-account-id <jazz-account-id> \
  --target-account-secret <sealerSecret_...> \
  --out-dir ./docs/jazz-migration/runs/dev-rehearsal \
  --confirm apply-dev
```

## Implemented Schema Notes

- Executable app schema (source of truth) is implemented in:
  - `src/lib/jazz/schema.ts`
- Legacy migration parity metadata + validators are still available in:
  - `src/lib/jazz-migration/schema-parity-scaffold.ts`
- Runtime schema models the existing training-log hierarchy directly in Jazz; Convex previously represented the same structure via table rows and relationship fields.
- Permissions model implemented in schema:
  - User-owned root/container strategy encoded with `withPermissions({ onInlineCreate: 'extendsContainer' })`
  - Nested entities default to extending container ownership (single-account private graph model)
- Invariant/reference validation helpers in the migration parity module remain available if migration tooling is resumed:
  - Referential integrity checks across entity links
  - Ordering checks and uniqueness by context (`slotOrder`, `workoutOrder`, `groupOrder`, `performanceOrder`, `targetOrder`)
  - Program run/session invariants (single active run, open-session completion semantics, run-session/workout linkage)
  - Runtime/parity schema drift checks for migration scaffolds
- Guardrail wiring module for item 4:
  - `src/lib/jazz-migration/migration-target-report.ts`
  - Provides builders that convert snapshot/entity rows into guardrail `targetCounts`, `referentialChecks`, and `invariantChecks`.
- Deterministic validator tests with realistic dataset fixtures are implemented in:
  - `src/lib/jazz-migration/schema-parity-scaffold.spec.ts`

## Cutover Plan

1. Complete schema/query/mutation migration to Jazz and remove Convex runtime usage.
2. Run migration script repeatedly against `dev` account while implementing endpoint parity.
3. Validate parity and app behavior after each rehearsal run.
4. Execute one final atomic full-replace migration for `prod` account.
5. Deploy finished Jazz-backed app immediately after final production migration.
