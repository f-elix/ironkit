<script lang="ts">
	import { resolve } from '$app/paths';
	import { DEFAULT_WORKOUT_TITLE } from '$lib/constants';
	import { formatDate } from '$lib/ui/formatDate';
	import AddWorkout from '$lib/components/training-log/AddWorkout.svelte';
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import DumbbellIcon from '@lucide/svelte/icons/dumbbell';
	import PlusIcon from '@lucide/svelte/icons/plus';

	const query = useQuery(api.workouts.list, {});

	let workouts = $derived(query.data ?? []);
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
					{@const title = workout.title ?? DEFAULT_WORKOUT_TITLE}
					{@const date = workout.date ? new Date(workout.date) : undefined}
					<li>
						<a
							href={resolve('/(app)/tools/training-log/workout-[id]', { id: workout._id })}
							class="bg-card hover:border-primary/50 flex flex-col rounded-lg border p-3 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
						>
							<span class="font-medium">{title}</span>
							{#if date}
								<span class="text-muted-foreground text-xs">{formatDate(date)}</span>
							{/if}
						</a>
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
					{@const title = workout.title ?? DEFAULT_WORKOUT_TITLE}
					{@const date = workout.date ? new Date(workout.date) : undefined}
					{@const note = workout.notes}
					{@const bodyweight = workout.bodyweight}
					{@const bodyweightUnit = workout.bodyweightUnit}
					<li>
						<a
							href={resolve('/(app)/tools/training-log/workout-[id]', { id: workout._id })}
							class="bg-card hover:border-primary/50 flex flex-col rounded-lg border p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
						>
							<span class="text-lg font-bold">{title}</span>
							{#if date}
								<span class="text-muted-foreground text-sm">{formatDate(date)}</span>
							{/if}
							{#if bodyweight}
								<span class="text-sm">
									<span class="font-medium">Bodyweight:</span>
									{bodyweight}
									{bodyweightUnit}
								</span>
							{/if}
							{#if note}
								<span class="mt-2 text-sm">{note}</span>
							{/if}
						</a>
					</li>
				{/each}
			</ul>
			<!-- Mobile: Floating Action Button -->
			<div class="fixed right-4 bottom-16 z-50">
				<AddWorkout
					size="icon"
					class="size-14 rounded-full bg-emerald-500 shadow-lg hover:bg-emerald-600"
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
