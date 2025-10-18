<script lang="ts">
	import { resolve } from '$app/paths';
	import { DEFAULT_WORKOUT_TITLE } from '$lib/constants';
	import { formatDate } from '$lib/ui/formatDate';
	import AddWorkout from '$lib/components/training-log/AddWorkout.svelte';
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';

	const query = useQuery(api.workouts.list, {});

	let workouts = $derived(query.data ?? []);
</script>

{#if workouts?.length}
	<div class="flex grow flex-col gap-4">
		<ul class="flex flex-col gap-4 px-4">
			{#each workouts as workout (workout._id)}
				{@const title = workout.title ?? DEFAULT_WORKOUT_TITLE}
				{@const date = new Date(workout.date)}
				{@const note = workout.notes}
				{@const bodyweight = workout.bodyweight}
				{@const bodyweightUnit = workout.bodyweightUnit}
				<li>
					<a
						href={resolve('/(app)/tools/training-log/workout-[id]', { id: workout._id })}
						class="bg-muted/30 flex flex-col rounded-md border p-4"
					>
						<span class="text-lg font-bold">{title}</span>
						<span class="text-muted-foreground text-sm">{formatDate(date)}</span>
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
		<div class="bg-background sticky bottom-0 mt-auto flex flex-col p-4 pb-4">
			<AddWorkout />
		</div>
	</div>
{:else}
	<div class="grow px-4 pb-4">
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
