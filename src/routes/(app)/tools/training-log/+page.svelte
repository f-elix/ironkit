<script lang="ts">
	import AddWorkout from '$lib/components/training-log/AddWorkout.svelte';
	import WorkoutButton from '$lib/components/training-log/WorkoutButton.svelte';
	import ActiveProgramCard from '$lib/components/training-log/ActiveProgramCard.svelte';
	import PausedProgramCard from '$lib/components/training-log/PausedProgramCard.svelte';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import DumbbellIcon from '@lucide/svelte/icons/dumbbell';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import SwipeToDelete from '$lib/components/ui/SwipeToDelete.svelte';
	import { cn } from '$lib/shadcn/utils';
	import type { Id } from '$convex/_generated/dataModel';
	import { flip } from 'svelte/animate';
	import { expoOut } from 'svelte/easing';
	import { scale } from 'svelte/transition';

	const workoutsQuery = useQuery(api.workouts.list, {});
	const activeRunQuery = useQuery(api.programRuns.getActiveRunWithDetails, {});

	const client = useConvexClient();

	let workouts = $derived(workoutsQuery.data ?? []);
	let activeRun = $derived(activeRunQuery.data);

	const nextSessionProps = $derived(
		activeRun?.nextSession?.weekNumber !== undefined && activeRun?.nextSession?.trackKey
			? {
					weekNumber: activeRun.nextSession.weekNumber,
					label: activeRun.nextSession.label,
					trackKey: activeRun.nextSession.trackKey
				}
			: null
	);

	const deleteWorkout = (workoutId: Id<'workouts'>) => {
		client.mutation(
			api.workouts.remove,
			{ id: workoutId },
			{
				optimisticUpdate: (localStore) => {
					localStore.setQuery(
						api.workouts.list,
						{},
						localStore.getQuery(api.workouts.list, {})?.filter((w) => w._id !== workoutId) ?? []
					);
				}
			}
		);
	};
</script>

{#snippet heroCardSkeleton()}
	<div class="bg-card animate-pulse rounded-xl border p-5">
		<div class="flex items-start justify-between gap-3">
			<div class="min-w-0 flex-1">
				<div class="bg-muted h-6 w-32 rounded"></div>
				<div class="bg-muted mt-2 h-4 w-48 rounded"></div>
				<div class="bg-muted mt-1.5 h-3 w-24 rounded"></div>
			</div>
			<div class="bg-muted size-8 shrink-0 rounded"></div>
		</div>
		<div class="bg-muted mt-4 h-10 w-full rounded"></div>
	</div>
{/snippet}

{#snippet activeProgramCard()}
	{#if activeRunQuery.isLoading}
		{@render heroCardSkeleton()}
	{:else if activeRun}
		{#if activeRun.run.status === 'paused'}
			<PausedProgramCard
				run={activeRun.run}
				template={activeRun.template}
				totalSessions={activeRun.totalSessions}
				completedSessions={activeRun.completedSessions}
			/>
		{:else}
			<ActiveProgramCard
				run={activeRun.run}
				template={activeRun.template}
				nextSession={nextSessionProps}
				totalSessions={activeRun.totalSessions}
				completedSessions={activeRun.completedSessions}
			/>
		{/if}
	{/if}
{/snippet}

{#snippet desktopWorkoutList()}
	<ul class="flex flex-col gap-3">
		{#each workouts as workout (workout._id)}
			<li
				class="hover:border-primary/50 overflow-hidden rounded-lg border transition-all active:scale-[0.98]"
			>
				<WorkoutButton {workout} />
			</li>
		{/each}
	</ul>
{/snippet}

<!-- Desktop: Split layout with empty state (2/3) and workout list (1/3) -->
<div class="hidden grow md:flex">
	{#if activeRun && workouts.length}
		<!-- Hero card centered - 2/3 width -->
		<div class="sticky top-20 flex h-[calc(100dvh-6.5rem)] basis-2/3 flex-col items-center justify-center self-start px-8">
			<div class="w-full max-w-md">
				{@render activeProgramCard()}
			</div>
		</div>
		<!-- Workout list - 1/3 width -->
		<div class="basis-1/3 overflow-y-auto pl-4">
			{@render desktopWorkoutList()}
		</div>
	{:else if activeRun}
		<!-- Hero card centered, no workouts -->
		<div class="flex grow items-center justify-center px-8">
			<div class="w-full max-w-md">
				{@render activeProgramCard()}
			</div>
		</div>
	{:else if workouts.length}
		<!-- Empty state with New Workout button - 2/3 width -->
		<div class="sticky top-20 flex h-[calc(100dvh-6.5rem)] basis-2/3 flex-col self-start">
			<EmptyState title="Select a workout">
				{#snippet icon()}
					<DumbbellIcon class="text-muted-foreground size-12" />
				{/snippet}
				{#snippet description()}
					Choose a workout from the list
					<br />
					or create a new one.
				{/snippet}
				{#snippet button()}
					<AddWorkout />
				{/snippet}
			</EmptyState>
		</div>
		<!-- Workout list - 1/3 width -->
		<div class="basis-1/3 overflow-y-auto pl-4">
			{@render desktopWorkoutList()}
		</div>
	{:else if !workoutsQuery.isLoading}
		<EmptyState title="No workouts yet">
			{#snippet icon()}
				<DumbbellIcon class="text-muted-foreground size-12" />
			{/snippet}
			{#snippet description()}
				Click the button below
				<br />
				to create your first workout.
			{/snippet}
			{#snippet button()}
				<AddWorkout />
			{/snippet}
		</EmptyState>
	{/if}
</div>

<!-- Mobile: Show workout list -->
<div class="flex grow flex-col p-4 md:hidden">
	{#if activeRun}
		<!-- Hero card at top for mobile -->
		<div class="mb-4">
			{@render activeProgramCard()}
		</div>
	{/if}
	{#if workouts.length}
		<div class="flex grow flex-col gap-4">
			<ul class="flex flex-col gap-4 pb-20">
				{#each workouts as workout (workout._id)}
					<li
						animate:flip={{ duration: 500, easing: expoOut }}
						in:scale={{ duration: 500, easing: expoOut, start: 0.5, opacity: 0.5 }}
						out:scale={{ duration: 300, easing: expoOut, start: 0.5, opacity: 0 }}
						class="overflow-hidden rounded-lg border transition-transform active:scale-[0.98]"
					>
						<SwipeToDelete ondelete={() => deleteWorkout(workout._id)}>
							<WorkoutButton {workout} />
						</SwipeToDelete>
					</li>
				{/each}
			</ul>
			<!-- Mobile: Floating Action Button (smaller/muted when active program exists) -->
			<div class="fixed right-4 bottom-16 z-50">
				<AddWorkout
					size="icon"
					class={cn(
						'rounded-full shadow-lg',
						activeRun
							? 'bg-muted text-muted-foreground hover:bg-muted/80 size-11'
							: 'bg-primary text-primary-foreground hover:bg-primary/90 size-14'
					)}
				>
					<PlusIcon class={activeRun ? 'size-5' : 'size-7'} />
				</AddWorkout>
			</div>
		</div>
	{:else if !workoutsQuery.isLoading && !activeRun}
		<div class="grow pb-4">
			<EmptyState title="No workouts yet">
				{#snippet description()}
					Click the button below
					<br />
					to create your first workout.
				{/snippet}
				{#snippet button()}
					<AddWorkout />
				{/snippet}
			</EmptyState>
		</div>
	{/if}
</div>
