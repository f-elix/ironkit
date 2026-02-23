# Convex to Jazz Migration Backlog

## Scope

Migrate backend data, auth integration, and all Convex query/mutation consumers to Jazz for:

- Tool preferences/state (`weightConverter`, `plateCalculator`, `coefficientCalculator`, `loadPercentageCalculator`)
- Exercises
- Workouts
- Program templates and related training-log graph

This is a personal app with one operator and two accounts:

- `dev` account for rehearsal/testing
- `prod` account for real data

## Status Legend

- `todo`: not started
- `in-progress`: currently active
- `done`: merged and validated
- `blocked`: waiting on decision/dependency

## Backlog

- [ ] 1. Pre-flight cutover guardrails (`todo`)
  - Define the exact final sequence: final prod migration run -> smoke validation -> deploy.
  - Capture baseline Convex snapshot counts per table (source of truth for parity checks).
  - Define explicit pass/fail gates for every rehearsal and final prod run:
    - table/entity counts match expected parity
    - referential and invariant checks pass
    - app smoke checks pass on migrated data
  - Define abort criteria and rerun procedure when any gate fails.

- [ ] 2. Jazz schema parity from Convex schema (`todo`)
  - Port Convex entities and enums into Jazz schema types.
  - Encode ownership/permissions by user-owned containers.
  - Preserve ordering constraints (`slotOrder`, `workoutOrder`, `groupOrder`, `performanceOrder`, `targetOrder`).
  - Document nullable/optional relationship fields and allowed parent contexts.

- [ ] 3. Auth migration to Better Auth + Jazz (`todo`)
  - Keep Google provider config.
  - Add Jazz Better Auth plugin and migration hooks.
  - Migrate accounts to Jazz-compatible IDs/session linkage.
  - Validate sign-in, sign-out, and session refresh paths in SvelteKit.

- [ ] 4. Data migration script: Convex export -> Jazz import (`todo`)
  - Implement deterministic export format with stable ordering.
  - Enforce atomic full-replace semantics on each run:
    - clear/replace target Jazz user-space data
    - import full dataset from Convex snapshot
    - never perform partial/incremental merge
  - Implement import with ID mapping tables:
    - old Convex IDs -> new Jazz node IDs
    - user/account mapping (Better Auth + Jazz account IDs)
  - Support dry-run and repeatable re-runs (script will be executed multiple times).
  - Add post-import parity report (counts + key invariants).

- [ ] 5. Migrate 5 tools query/mutation layer (`todo`)
  - Move tool state persistence reads/writes to Jazz API layer.
  - Note: `oneRepMaxCalculator` has no Convex persistence; verify no backend work needed.
  - Remove Convex client usage from tool pages/components.

- [ ] 6. Migrate exercises query/mutation layer (`todo`)
  - Port list/get/create/update/remove flows.
  - Preserve delete guards against active/non-archived program dependencies.
  - Preserve cascading delete behavior for dependent performances/sets/targets.

- [ ] 7. Migrate workouts query/mutation layer (`todo`)
  - Port list/get/create/update/remove flows.
  - Preserve run/session linking semantics.
  - Preserve remove behavior that reopens/completes run state correctly.

- [ ] 8. Migrate program templates query/mutation layer (`todo`)
  - Port template CRUD + archive.
  - Port `programWorkouts`, `programWorkoutGroups`, `programWorkoutExercises`, `programWorkoutExerciseSets`.
  - Port `programRuns`, `programRunSessions`, `programsCore` invariants.
  - Preserve ordering and unfinished-session guards.

- [ ] 9. Frontend client migration (`todo`)
  - Replace `convex-svelte` usage with Jazz data access utilities.
  - Replace generated Convex API references in components/routes.
  - Remove Convex-specific auth/client wrappers.

- [ ] 10. Verification, cleanup, and decommission (`todo`)
  - Run `pnpm lc` and targeted integration tests.
  - Run repeated `dev` account migration rehearsals until parity checks are stable.
  - Execute one final atomic migration on `prod` account immediately before deploy.
  - Deploy finished migration all at once.
  - Remove Convex schema/functions/dependencies in the same cutover.
  - Document final migration report.

## Sequencing

Final sequence:

1. Jazz schema from Convex schema
2. Better Auth + Jazz + Google auth migration
3. Atomic full-replace Convex -> Jazz migration script
4. Tools queries/mutations
5. Exercises queries/mutations
6. Workouts queries/mutations
7. Program template and program run queries/mutations
8. Rehearsal runs on `dev`, final run on `prod`, then single deploy cutover
