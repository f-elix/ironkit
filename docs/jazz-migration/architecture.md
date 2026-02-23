# Convex to Jazz Migration Architecture

## Goals

- Replace Convex persistence and Convex API calls with Jazz.
- Preserve existing behavior and user data for all training-log flows.
- Keep Better Auth with Google login, migrated to Jazz-compatible account storage.
- Support repeated full migration rehearsals and final one-shot production cutover.

## Non-goals

- Redesigning product behavior during migration.
- Progressive rollout, dual-backend operation, or backwards compatibility with Convex at runtime.

## Operating Assumptions

- This is a personal app with one operator.
- Two accounts exist:
  - `dev` for repeated migration rehearsal
  - `prod` for real data
- Final release is a single all-at-once cutover.

## Current State (Convex)

- Data model is table-based with explicit `userId` ownership and indexes.
- Frontend calls Convex query/mutation endpoints directly through generated API types.
- Better Auth runs with Convex adapter/plugin and Google provider.

## Target State (Jazz)

## Data Ownership Model

- Primary container: one user-owned root graph per account (for private training data).
- Entities remain normalized (separate objects for workouts, exercises, templates, runs, etc.).
- References between entities are explicit IDs/links, preserving existing relationships.

## Schema Shape (High Level)

```ts
import { co, z } from 'jazz-tools';

const ToolPreferences = co.map({
	weightConverter: co.map({ unit: z.enum(['kg', 'lbs']), round: z.boolean() }),
	loadPercentageCalculator: co.map({ unit: z.enum(['kg', 'lbs']), round: z.boolean() }),
	coefficientCalculator: co.map({
		genderClass: z.enum(['male', 'female']),
		totalUnit: z.enum(['kg', 'lbs']),
		bodyweightUnit: z.enum(['kg', 'lbs'])
	}),
	plateCalculator: co.map({
		barWeight: z.number(),
		heavyCollars: z.boolean(),
		allowNonStandardConfig: z.boolean()
	})
});

const UserSpace = co.map({
	tools: ToolPreferences,
	exercises: co.list(Exercise),
	workouts: co.list(Workout),
	performanceGroups: co.list(PerformanceGroup),
	performances: co.list(Performance),
	performanceSets: co.list(PerformanceSet),
	programTemplates: co.list(ProgramTemplate),
	programWorkouts: co.list(ProgramWorkout),
	programWorkoutExerciseTargets: co.list(ProgramWorkoutExerciseTarget),
	programRuns: co.list(ProgramRun),
	programRunSessions: co.list(ProgramRunSession)
});
```

## Relationship and Invariant Parity

Must preserve current Convex invariants:

- Exactly one parent context for a group/performance (`workoutId` xor `programWorkoutId`).
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
- Replace Convex adapter/plugin with Jazz plugin integration.
- Use Jazz migration hooks for existing accounts so users keep access to prior data.
- Keep SvelteKit auth route pattern (`/api/auth/[...all]`) and migrate handler internals.

Reference used: [Jazz LLM docs](https://jazz.tools/llms-full.txt) (Better Auth plugin + migration APIs).

## Data Migration Architecture

## Export

- Script reads Convex data table-by-table using admin credentials.
- Output deterministic JSON files (or NDJSON) with:
  - source row payload
  - source `_id`
  - source table name

## Transform

- Normalize enums and optional fields to Jazz schema shape.
- Build mapping dictionaries:
  - `convexId -> jazzId`
  - `convexUserId -> jazzAccountId`

## Import

- Import uses atomic full-replace semantics on every run.
- Strategy:
  - build a complete new Jazz user-space graph from snapshot data
  - perform all reference wiring and parity checks on that new graph
  - switch active root pointer only after successful build/validation
  - delete previous user-space graph after successful switch
- This ensures each execution is replace-all and avoids partial merge state.
- Import order within the new graph still follows topological phases:
  - independent entities (tool prefs, exercises, templates)
  - dependent graph nodes (program workouts/groups/exercises/targets, workouts/groups/performances/sets)
  - runs and sessions
  - second-pass patching for cyclic optional references (`workout.programRunSessionId` and `session.workoutId`)

## Verification

- Parity report:
  - row counts per logical entity
  - referential integrity checks
- invariant checks (active run uniqueness, unfinished-session constraints)

## Implemented Schema Parity Scaffold

- Initial Convex -> Jazz schema parity scaffold is defined in:
  - `src/lib/jazz-migration/schema-parity-scaffold.ts`
- Current scaffold includes:
  - Convex enum parity (`weightUnit`, `genderClass`, execution/load types, statuses)
  - Entity field parity for all training-log/tool tables
  - User-owned container/permission policy for Jazz user-space root
  - Ordering constraints (`slotOrder`, `workoutOrder`, `groupOrder`, `performanceOrder`, `targetOrder`)
  - Nullable relationship and parent-context rules (`workoutId` xor `programWorkoutId`)
- Next step is converting this scaffold into concrete `jazz-tools` `co.map` / `co.list` definitions after adding Jazz runtime dependencies.

## Cutover Plan

1. Run migration script repeatedly against `dev` account while implementing endpoint parity.
2. Validate parity and app behavior after each rehearsal run.
3. Complete all query/mutation migrations and remove Convex runtime usage.
4. Execute one final atomic full-replace migration for `prod` account.
5. Deploy finished Jazz-backed app immediately after final production migration.
