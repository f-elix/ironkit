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
- Kept training-log code paths unchanged.
- Ran Svelte autofixer on all edited Svelte files.

### Validation

- `pnpm check`: passes (existing project warnings remain in unrelated training-log files).
- `pnpm exec eslint <edited files>`: passes for all migrated calculator pages.
- `pnpm lint`: still fails due a pre-existing `no-console` error in `src/routes/api/auth/[...all]/+server.ts`.
