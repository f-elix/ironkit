<script lang="ts">
	import AddWorkout from '$lib/components/training-log/AddWorkout.svelte';
	import WorkoutButton from '$lib/components/training-log/WorkoutButton.svelte';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import DumbbellIcon from '@lucide/svelte/icons/dumbbell';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import SwipeToDelete from '$lib/components/ui/SwipeToDelete.svelte';
	import type { Id } from '$convex/_generated/dataModel';
	import { flip } from 'svelte/animate';
	import { expoOut } from 'svelte/easing';
	import { scale } from 'svelte/transition';

	const query = useQuery(api.workouts.list, {});

	const client = useConvexClient();

	let workouts = $derived(query.data ?? []);

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

<!-- Desktop: Split layout with empty state (2/3) and workout list (1/3) -->
<div class="hidden grow md:flex">
	{#if workouts?.length}
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
			<ul class="flex flex-col gap-3">
				{#each workouts as workout (workout._id)}
					<li
						class="hover:border-primary/50 overflow-hidden rounded-lg border transition-all active:scale-[0.98]"
					>
						<WorkoutButton {workout} />
					</li>
				{/each}
			</ul>
		</div>
	{:else if !query.isLoading}
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
	{#if workouts?.length}
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
			<!-- Mobile: Floating Action Button -->
			<div class="fixed right-4 bottom-16 z-50">
				<AddWorkout
					size="icon"
					class="bg-primary text-primary-foreground hover:bg-primary/90 size-14 rounded-full shadow-lg"
				>
					<PlusIcon class="size-7" />
				</AddWorkout>
			</div>
		</div>
	{:else if !query.isLoading}
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
