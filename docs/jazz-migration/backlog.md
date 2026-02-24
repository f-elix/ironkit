# Convex to Jazz Migration Backlog

## Scope

Migrate backend persistence, auth integration, and all Convex query/mutation consumers to Jazz for:

- Tool preferences/state (`weightConverter`, `plateCalculator`, `coefficientCalculator`, `loadPercentageCalculator`)
- Exercises
- Workouts
- Program templates and related training-log graph

This is a personal app with one operator and two accounts:

- `dev` account for rehearsal/testing
- `prod` account for real data

Temporary app breakage is expected during active migration work; full runtime stability is only required at final verification/cutover (item 10).

## Status Legend

- `todo`: not started
- `in-progress`: currently active
- `done`: merged and validated
- `blocked`: waiting on decision/dependency

## Backlog

- [x] 1. Pre-flight cutover guardrails (`done`)
  - Define the exact final sequence: final prod migration run -> smoke validation -> deploy.
  - Capture baseline Convex snapshot counts per table (source of truth for parity checks).
  - Define explicit pass/fail gates for every rehearsal and final prod run:
    - table/entity counts match expected parity
    - referential and invariant checks pass
    - app smoke checks pass on migrated data
  - Define abort criteria and rerun procedure when any gate fails.
  - Implemented:
    - `docs/jazz-migration/cutover-guardrails.md`
    - `src/lib/jazz-migration/preflight-guardrails.ts`
    - `scripts/jazz-migration/preflight-guardrails.ts`
    - `docs/jazz-migration/baselines/README.md`

- [x] 2. Jazz schema modeling of existing hierarchy (`done`)
  - Port core entities/enums into Jazz schema types.
  - Encode ownership/permissions by user-owned containers.
  - Keep ordering constraints (`slotOrder`, `workoutOrder`, `groupOrder`, `performanceOrder`, `targetOrder`).
  - Model the existing training-log hierarchy explicitly as parent-first nesting:
    - `workout -> performanceGroups -> performances -> performanceSets`
    - `programTemplate -> programWorkouts -> performanceGroups -> performances -> programWorkoutExerciseTargets`
    - `programRun -> programRunSessions`
  - Implemented:
    - Executable Jazz schema definitions in `src/lib/jazz/schema.ts` with explicit parent-first performance graph nesting and preserved bidirectional references for group/performance/set ownership.
    - User-owned root/container permission defaults via schema-level `withPermissions` and `extendsContainer` inline-create semantics.
    - Legacy parity scaffolds remain in `src/lib/jazz-migration/schema-parity-scaffold.ts` for optional future migration tooling; Convex and Jazz represent the same domain hierarchy with different modeling patterns.

- [x] 3. Auth migration to Better Auth + Jazz (`done`)
  - Keep Google provider config.
  - Add Jazz Better Auth plugin and migration hooks.
  - Migrate accounts to Jazz-compatible IDs/session linkage.
  - Validate sign-in, sign-out, and session refresh paths in SvelteKit.
  - Implemented:
    - Added Jazz Better Auth client plugin (`jazzPluginClient`) on a dedicated Better Auth client in `src/lib/auth-client.ts`.
    - Added Jazz account schema (`JazzAccount`) with training-log data at account `root` (no `userSpace` wrapper) in `src/lib/jazz/schema.ts`.
    - Wrapped app rendering with `JazzSvelteProvider` + Jazz Better Auth `AuthProvider` in `src/routes/+layout.svelte`.
    - Kept Convex Better Auth server configuration unchanged (no Convex auth migration hooks added at this stage, and no Convex/Jazz auth mixing in `src/lib/auth-client.ts`).

- [ ] 4. Data migration script: Convex export -> Jazz import (`in-progress`)
  - Implement deterministic export format with stable ordering.
  - Enforce atomic full-replace semantics on each run:
    - clear/replace target Jazz user-space data
    - import full dataset from Convex snapshot
    - never perform partial/incremental merge
  - Implement import with ID mapping tables:
    - old Convex IDs -> new Jazz node IDs
    - user/account mapping (Better Auth + Jazz account IDs)
  - Support dry-run and repeatable re-runs (`dev` rehearsals before final `prod` run).
  - Add post-import parity report (counts + key invariants).
  - Implemented (current slice):
    - Added deterministic Convex snapshot normalization + stable row ordering utilities in `src/lib/jazz-migration/snapshot-utils.ts`.
    - Added migration planning artifact builder in `src/lib/jazz-migration/migration-plan.ts`:
      - deterministic source snapshot artifact
      - source Convex ID -> planned Jazz ID mapping tables
      - source `userId` ownership validation against explicit `--source-user-id`
      - guardrail-compatible `target-report.json` generation via `createMigrationTargetReportFromSnapshotRows(...)`
    - Added migration CLI with `plan` (dry-run) and `apply` (write) modes:
      - `scripts/jazz-migration/migrate-convex-to-jazz.ts`
      - `scripts/jazz-migration/run-migrate-convex-to-jazz.mjs`
    - Added real Jazz apply/write path in `src/lib/jazz-migration/apply-import.ts`:
      - builds complete replacement account root graph from deterministic snapshot rows
      - records actual Convex `_id` -> created Jazz node ID mappings
      - executes root pointer switch (`account.root = replacementRoot`) and deletes previous root on success
      - emits post-apply guardrail target report from imported rows rewritten to created Jazz IDs
    - Added deterministic migration planning tests in `src/lib/jazz-migration/migration-plan.spec.ts`.
  - Remaining for item 4 completion:
    - Wire rehearsal/final smoke checks from runtime app flows into migration target reports.
    - Validate apply mode against real `dev` account credentials/sync server and confirm root-switch behavior end-to-end.
    - Run repeated `dev` rehearsals, then final `prod` run immediately before cutover deployment.

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

1. Jazz schema modeling of existing hierarchy and stabilization
2. Better Auth + Jazz + Google auth migration
3. Data migration script (Convex export -> Jazz import)
4. Tools queries/mutations
5. Exercises queries/mutations
6. Workouts queries/mutations
7. Program template and program run queries/mutations
8. Rehearsals on `dev`, final run on `prod`
9. Single deploy cutover
