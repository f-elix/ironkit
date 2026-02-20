# Active Program Tracking Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable users to activate a program template and track progress through sessions with a hero card UI on the Workouts page.

**Architecture:** Hero card component queries active program run and displays next session. Program run detail page shows full progress with session states. Activation buttons added to programs list and template editor, calling existing `programRuns.activateTemplate` mutation.

**Tech Stack:** SvelteKit, Convex (queries/mutations already exist), Tailwind CSS, shadcn-svelte components

---

## Task 1: Active Program Hero Card Component

**Files:**
- Create: `src/lib/components/training-log/ActiveProgramCard.svelte`

**Step 1: Create the hero card component**

Create a component that displays:
- Program name (from template)
- Next session label: "Week X · [Label or Track]"
- Progress indicator: "Session N of M"
- "Start Workout" primary button
- Overflow menu with: Skip session, View program, Pause program

```svelte
<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { api } from '$convex/_generated/api';
	import type { Doc, Id } from '$convex/_generated/dataModel';
	import { Button } from '$lib/shadcn/button';
	import * as DropdownMenu from '$lib/shadcn/dropdown-menu';
	import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
	import FastForwardIcon from '@lucide/svelte/icons/fast-forward';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import PauseIcon from '@lucide/svelte/icons/pause';
	import PlayIcon from '@lucide/svelte/icons/play';
	import { useConvexClient } from 'convex-svelte';

	type ActiveRunData = {
		_id: Id<'programRuns'>;
		programTemplateId: Id<'programTemplates'>;
		status: 'active' | 'paused';
		startedAt: number;
		nextSession: {
			_id: Id<'programRunSessions'>;
			programWorkoutId: Id<'programWorkouts'>;
		} | null;
	};

	type TemplateData = Doc<'programTemplates'>;

	type NextSessionData = {
		weekNumber: number;
		label?: string;
		trackKey: string;
	};

	let {
		run,
		template,
		nextSession,
		totalSessions,
		completedSessions
	}: {
		run: ActiveRunData;
		template: TemplateData;
		nextSession: NextSessionData | null;
		totalSessions: number;
		completedSessions: number;
	} = $props();

	const client = useConvexClient();

	let isStarting = $state(false);
	let isSkipping = $state(false);
	let isPausing = $state(false);

	const sessionLabel = $derived(
		nextSession
			? `Week ${nextSession.weekNumber} · ${nextSession.label || nextSession.trackKey}`
			: 'Program complete'
	);

	const progressLabel = $derived(`Session ${completedSessions + 1} of ${totalSessions}`);

	const startWorkout = async () => {
		if (isStarting || !nextSession) return;
		isStarting = true;
		try {
			const result = await client.mutation(api.programRunSessions.startNextAsWorkout, {
				programRunId: run._id
			});
			goto(resolve('/(app)/tools/training-log/workout-[id]', { id: result.workoutId }));
		} finally {
			isStarting = false;
		}
	};

	const skipSession = async () => {
		if (isSkipping) return;
		isSkipping = true;
		try {
			await client.mutation(api.programRunSessions.skipNext, {
				programRunId: run._id
			});
		} finally {
			isSkipping = false;
		}
	};

	const pauseProgram = async () => {
		if (isPausing) return;
		isPausing = true;
		try {
			await client.mutation(api.programRuns.pauseRun, { id: run._id });
		} finally {
			isPausing = false;
		}
	};

	const viewProgram = () => {
		goto(resolve('/(app)/tools/training-log/program-run-[id]', { id: run._id }));
	};
</script>

<div class="bg-card rounded-xl border p-5">
	<div class="flex items-start justify-between gap-4">
		<div class="min-w-0 flex-1">
			<h2 class="truncate text-lg font-bold">{template.name}</h2>
			<p class="text-muted-foreground mt-0.5 text-sm">{sessionLabel}</p>
			<p class="text-muted-foreground mt-1 text-xs tabular-nums">{progressLabel}</p>
		</div>

		<DropdownMenu.Root>
			<DropdownMenu.Trigger class="text-muted-foreground hover:text-foreground -mr-2 -mt-1 p-2">
				<EllipsisVerticalIcon class="size-5" />
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end">
				{#if nextSession}
					<DropdownMenu.Item onSelect={skipSession} disabled={isSkipping}>
						<FastForwardIcon />
						Skip session
					</DropdownMenu.Item>
				{/if}
				<DropdownMenu.Item onSelect={viewProgram}>
					<EyeIcon />
					View program
				</DropdownMenu.Item>
				<DropdownMenu.Item onSelect={pauseProgram} disabled={isPausing}>
					<PauseIcon />
					Pause program
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>

	{#if nextSession}
		<Button onclick={startWorkout} disabled={isStarting} class="mt-4 w-full" size="lg">
			<PlayIcon class="size-5" />
			{isStarting ? 'Starting...' : 'Start Workout'}
		</Button>
	{:else}
		<p class="text-muted-foreground mt-4 text-center text-sm">All sessions completed!</p>
	{/if}
</div>
```

**Step 2: Run linter to verify**

Run: `pnpm check`
Expected: No errors for the new file

**Step 3: Commit**

```bash
git add src/lib/components/training-log/ActiveProgramCard.svelte
git commit -m "feat: add ActiveProgramCard component for hero card UI"
```

---

## Task 2: Convex Query for Active Run with Session Counts

**Files:**
- Modify: `src/convex/programRuns.ts`

**Step 1: Add query to get active run with template and session counts**

Add a new query `getActiveRunWithDetails` that returns the active run plus:
- The template document
- Next session's programWorkout data (weekNumber, label, trackKey)
- Total session count
- Completed session count

```typescript
export const getActiveRunWithDetails = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return null;
		}
		const activeRun = await ctx.db
			.query('programRuns')
			.withIndex('by_userId_status', (q) => q.eq('userId', userId).eq('status', 'active'))
			.first();
		if (!activeRun) {
			return null;
		}

		const template = await ctx.db.get(activeRun.programTemplateId);
		if (!template) {
			return null;
		}

		const sessions = await ctx.db
			.query('programRunSessions')
			.withIndex('by_programRunId', (q) => q.eq('programRunId', activeRun._id))
			.collect();

		const completedSessions = sessions.filter((s) => s.workoutId || s.skippedAt).length;
		const totalSessions = sessions.length;

		const nextSession = await getNextOpenRunSession(ctx, activeRun._id);
		let nextSessionDetails = null;
		if (nextSession) {
			const programWorkout = await ctx.db.get(nextSession.programWorkoutId);
			if (programWorkout) {
				nextSessionDetails = {
					weekNumber: programWorkout.weekNumber,
					label: programWorkout.label,
					trackKey: programWorkout.trackKey
				};
			}
		}

		return {
			run: activeRun,
			template,
			nextSession: nextSession
				? {
						...nextSession,
						...nextSessionDetails
					}
				: null,
			totalSessions,
			completedSessions
		};
	}
});
```

**Step 2: Run type check**

Run: `pnpm check`
Expected: PASS

**Step 3: Commit**

```bash
git add src/convex/programRuns.ts
git commit -m "feat: add getActiveRunWithDetails query for hero card data"
```

---

## Task 3: Integrate Hero Card into Workouts Page

**Files:**
- Modify: `src/routes/(app)/tools/training-log/+page.svelte`

**Step 1: Import and query active run**

Add query for active run and conditionally render the hero card at the top of both mobile and desktop layouts.

**Step 2: Update desktop layout**

When active run exists, show hero card in the 2/3 area instead of empty state. When no active run, keep current empty state behavior.

**Step 3: Update mobile layout**

When active run exists, show hero card at top of page above "Recent Workouts" section. Reduce FAB prominence (smaller, muted colors).

**Step 4: Run and verify**

Run: `pnpm dev`
Expected: Hero card appears when there's an active program run

**Step 5: Commit**

```bash
git add src/routes/(app)/tools/training-log/+page.svelte
git commit -m "feat: integrate ActiveProgramCard into workouts page"
```

---

## Task 4: Program Run Detail Page

**Files:**
- Create: `src/routes/(app)/tools/training-log/program-run-[id]/+page.svelte`

**Step 1: Create the route page**

Page displays:
- Back button
- Program name and start date
- Progress bar with "X of Y" sessions
- Week-by-week session list with states (completed ✓, up next →, pending ○, skipped)
- Completed sessions link to their workouts
- Footer with Pause/Resume and Cancel buttons

**Step 2: Add Convex query for run details**

Use `programRuns.getById` which already returns sessions. Need to enhance it to include programWorkout details for each session.

**Step 3: Run and verify**

Run: `pnpm dev`
Navigate to `/tools/training-log/program-run-[id]`
Expected: Full program progress view displays

**Step 4: Commit**

```bash
git add src/routes/(app)/tools/training-log/program-run-[id]/+page.svelte
git commit -m "feat: add program run detail page with progress tracking"
```

---

## Task 5: Enhance getById Query for Run Detail Page

**Files:**
- Modify: `src/convex/programRuns.ts`

**Step 1: Enhance getById to include workout links and programWorkout details**

For each session, include:
- programWorkout details (weekNumber, slotOrder, trackKey, label)
- workout details if completed (title, date)
- skippedAt timestamp if skipped

```typescript
export const getById = query({
	args: {
		id: v.id('programRuns')
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return null;
		}
		const run = await assertOwnedProgramRun(ctx, args.id, userId);
		const template = await ctx.db.get(run.programTemplateId);
		const sessions = await getOrderedRunSessions(ctx, run._id);

		const sessionsWithDetails = await Promise.all(
			sessions.map(async (session) => {
				const programWorkout = await ctx.db.get(session.programWorkoutId);
				const workout = session.workoutId ? await ctx.db.get(session.workoutId) : null;
				return {
					...session,
					programWorkout: programWorkout
						? {
								weekNumber: programWorkout.weekNumber,
								slotOrder: programWorkout.slotOrder,
								trackKey: programWorkout.trackKey,
								label: programWorkout.label
							}
						: null,
					workout: workout
						? {
								_id: workout._id,
								title: workout.title,
								date: workout.date
							}
						: null
				};
			})
		);

		return {
			...run,
			template,
			sessions: sessionsWithDetails
		};
	}
});
```

**Step 2: Run type check**

Run: `pnpm check`
Expected: PASS

**Step 3: Commit**

```bash
git add src/convex/programRuns.ts
git commit -m "feat: enhance getById query with session and workout details"
```

---

## Task 6: Start Program Button on Programs List

**Files:**
- Modify: `src/lib/components/training-log/programs/ProgramTemplateListItem.svelte`
- Modify: `src/routes/(app)/tools/training-log/programs/+page.svelte`

**Step 1: Add workoutCount and activeRunId props to ProgramTemplateListItem**

**Step 2: Add Start/View button to card**

- If `activeRunId` matches this template's active run: show "View Active Run" button → navigates to run page
- Else if `workoutCount > 0`: show "Start" button → calls activateTemplate, navigates to workouts
- Else: show disabled "Start" button with tooltip "Add workouts first"

**Step 3: Pass data from programs page**

Query workout counts per template and active run. Pass to each list item.

**Step 4: Add confirmation dialog for replacing active program**

If there's already an active run for a different template, show confirmation before activating.

**Step 5: Run and verify**

Run: `pnpm dev`
Expected: Start buttons appear on template cards with correct states

**Step 6: Commit**

```bash
git add src/lib/components/training-log/programs/ProgramTemplateListItem.svelte
git add src/routes/(app)/tools/training-log/programs/+page.svelte
git commit -m "feat: add start program button to programs list"
```

---

## Task 7: Start Program Button in Template Editor

**Files:**
- Modify: `src/lib/components/training-log/program-template/ProgramTemplateHeaderCard.svelte`

**Step 1: Add start button to header**

Similar logic to programs list:
- Show "View Active Run" if this template has an active run
- Show "Start Program" if workouts exist
- Disabled if no workouts

**Step 2: Add confirmation dialog**

Same confirmation for replacing active program.

**Step 3: Run and verify**

Run: `pnpm dev`
Expected: Start button in template editor header

**Step 4: Commit**

```bash
git add src/lib/components/training-log/program-template/ProgramTemplateHeaderCard.svelte
git commit -m "feat: add start program button to template editor"
```

---

## Task 8: Convex Queries for Workout Counts and Active Run

**Files:**
- Modify: `src/convex/programTemplates.ts`

**Step 1: Enhance list query to include workout counts**

```typescript
export const list = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return [];
		}
		const templates = await ctx.db
			.query('programTemplates')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.collect();

		const templatesWithCounts = await Promise.all(
			templates.map(async (template) => {
				const workouts = await ctx.db
					.query('programWorkouts')
					.withIndex('by_programTemplateId', (q) => q.eq('programTemplateId', template._id))
					.collect();
				return {
					...template,
					workoutCount: workouts.length
				};
			})
		);

		return templatesWithCounts.sort((a, b) => b.updatedAt - a.updatedAt);
	}
});
```

**Step 2: Run type check**

Run: `pnpm check`
Expected: PASS

**Step 3: Commit**

```bash
git add src/convex/programTemplates.ts
git commit -m "feat: add workout counts to program templates list query"
```

---

## Task 9: Cancel Program with Confirmation

**Files:**
- Create: `src/lib/components/training-log/programs/CancelProgramDialog.svelte`
- Modify: `src/routes/(app)/tools/training-log/program-run-[id]/+page.svelte`

**Step 1: Create confirmation dialog component**

Simple dialog with warning text and Cancel/Confirm buttons.

**Step 2: Wire up to run detail page**

Cancel button opens dialog; confirmation calls `programRuns.cancelRun` and navigates to workouts page.

**Step 3: Run and verify**

Run: `pnpm dev`
Expected: Cancel shows confirmation, then removes active program

**Step 4: Commit**

```bash
git add src/lib/components/training-log/programs/CancelProgramDialog.svelte
git add src/routes/(app)/tools/training-log/program-run-[id]/+page.svelte
git commit -m "feat: add cancel program confirmation dialog"
```

---

## Task 10: Resume Paused Program

**Files:**
- Modify: `src/routes/(app)/tools/training-log/program-run-[id]/+page.svelte`
- Create: `src/lib/components/training-log/PausedProgramCard.svelte`

**Step 1: Handle paused state in run detail page**

Show "Resume" button instead of "Pause" when status is paused.

**Step 2: Create PausedProgramCard for workouts page**

When program is paused, show a muted version of the hero card with "Resume" button instead of "Start Workout".

**Step 3: Update workouts page to handle paused state**

Query should also return paused runs; show PausedProgramCard when paused.

**Step 4: Commit**

```bash
git add src/routes/(app)/tools/training-log/program-run-[id]/+page.svelte
git add src/lib/components/training-log/PausedProgramCard.svelte
git add src/routes/(app)/tools/training-log/+page.svelte
git commit -m "feat: add resume functionality for paused programs"
```

---

## Task 11: Final Polish and Edge Cases

**Files:**
- Various components

**Step 1: Handle loading states**

Add skeleton loaders for hero card while query loads.

**Step 2: Handle completed program**

When all sessions done, hero card should show completion message and link to view program history.

**Step 3: Toast notifications**

Add toast for: "Program started", "Session skipped", "Program paused", "Program canceled"

**Step 4: Run full test**

Run: `pnpm check && pnpm lint`
Expected: PASS

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add polish and edge case handling for program tracking"
```
