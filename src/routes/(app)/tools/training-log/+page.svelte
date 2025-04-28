<script lang="ts">
	import { PAGE_tools_training_log_workout_id } from '$lib/ROUTES';
	import { DEFAULT_WORKOUT_TITLE } from '$lib/constants';
	import { formatDate } from '$lib/ui/formatDate';
	import AddWorkout from '$lib/components/training-log/AddWorkout.svelte';
	import { triplit } from '$lib/db/triplit';
	import { useQuery } from '@triplit/svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';

	const query = useQuery(triplit, triplit.query('workouts').Order('date', 'DESC'));

	let workouts = $derived(query.results);
</script>

{#if workouts?.length}
	<div class="flex grow flex-col gap-4">
		<ul class="flex flex-col gap-4 px-4">
			{#each workouts as workout (workout.id)}
				{@const title = workout.title ?? DEFAULT_WORKOUT_TITLE}
				{@const date = workout.date}
				{@const note = workout.notes}
				<li>
					<a
						href={PAGE_tools_training_log_workout_id({ id: workout.id })}
						class="flex flex-col rounded-md border bg-muted/30 p-4"
					>
						<span class="flex items-center justify-between gap-4">
							<span class="text-lg font-bold">{title}</span>
							<span class="text-sm text-muted-foreground">{formatDate(date)}</span>
						</span>
						{#if note}
							<span class="mt-2 text-sm">{note}</span>
						{/if}
					</a>
				</li>
			{/each}
		</ul>
		<div class="sticky bottom-0 mt-auto flex flex-col bg-background p-4 pb-4">
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
