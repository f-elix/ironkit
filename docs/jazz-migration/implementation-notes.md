# Jazz Migration Implementation Notes

## 2026-02-25

### Completed

- Replaced Convex `useQueryMutation` usage in:
  - `src/routes/(app)/tools/weight-converter/+page.svelte`
  - `src/routes/(app)/tools/coefficient-calculator/+page.svelte`
  - `src/routes/(app)/tools/load-percentage-calculator/+page.svelte`
  - `src/routes/(app)/tools/plate-calculator/+page.svelte`
- Added `AccountCoState`-based reads from `Account.root` singleton calculator maps.
- Updated tool pages to match corrected singleton calculator schema (`Account.root.<calculator>` maps, not lists).
- Added inline Jazz singleton update logic with `updatedAt` patching.
- Ran Svelte autofixer on all edited Svelte files.
- Migrated training-log root page and direct child components from Convex hooks/mutations to Jazz account-root flow:
  - `src/routes/(app)/tools/training-log/+page.svelte`
  - `src/lib/components/training-log/ActiveProgramCard.svelte`
  - `src/lib/components/training-log/PausedProgramCard.svelte`
  - `src/lib/components/training-log/WorkoutButton.svelte`
  - `src/lib/components/training-log/WorkoutInfoDialog.svelte`
  - `src/lib/components/training-log/PreviousWorkoutSelection.svelte`
- Added Jazz-based run/workout action handling for root-page features (list/add/delete workout, start/skip/pause/resume/cancel run).
- Key Jazz CoValue patterns used in ActiveProgramCard and PausedProgramCard:
  - `run.$jazz.set('status', 'paused')` for updating CoMap properties
  - `run.programRunSessions.$jazz.push(session)` for adding to CoList
  - `ProgramRunSession.create({...})` for creating new CoValues
  - Added `ResolvedProgramRun` type in `src/lib/jazz/types.ts` for deep resolution typing
  - Updated page resolution to include `programTemplate.programWorkouts` and `programRunSessions` with nested refs

### Validation

- `pnpm check`: passes (existing project warnings remain in unrelated training-log files).
- `pnpm exec eslint <edited files>`: passes for all migrated calculator pages.
- `pnpm exec eslint <edited training-log root files>`: passes.
- `pnpm lint`: still fails due a pre-existing `no-console` error in `src/routes/api/auth/[...all]/+server.ts`.
