<script lang="ts">
	import { formatDate } from '$lib/ui/formatDate';
	import { useQuery } from 'convex-svelte';
	import { ScrollArea } from '$lib/shadcn/scroll-area';
	import type { Workout } from '$lib/db/types';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { today } from '@internationalized/date';
	import { TIMEZONE } from '$lib/constants';
	import PerformanceSetSummary from '$lib/components/training-log/PerformanceSetSummary.svelte';
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';

	let {
		exerciseId,
		currentWorkout
	}: { exerciseId: Id<'exercises'>; currentWorkout?: Maybe<Workout> } = $props();

	const query = useQuery(api.performances.getByExercise, {
		exerciseId,
		currentWorkoutId: currentWorkout?._id,
		maxDate: currentWorkout ? undefined : today(TIMEZONE).toDate(TIMEZONE).getTime(),
		limit: 10
	});

	let performances = $derived(query.data ?? []);
</script>

{#if performances.length}
	<ScrollArea class="h-[50vh]">
		<ul class="divide-border flex flex-col gap-4 divide-y pt-4 pb-7">
			{#each performances as performance (performance._id)}
				{@const date = formatDate(
					performance.workout?.date ? new Date(performance.workout.date) : undefined
				)}
				{@const sets = performance.sets ?? []}
				{@const note = performance.note}
				{#if sets.length}
					<li class="flex flex-col gap-3 pb-4">
						<div class="flex flex-col gap-1">
							<h4 class="text-base font-semibold">{date}</h4>
							{#if note}
								<p class="text-muted-foreground text-sm">{note}</p>
							{/if}
						</div>
						<ul class="flex flex-col gap-2">
							{#each sets as set, i (set._id)}
								<li class="flex w-full items-baseline gap-2">
									<PerformanceSetSummary {set} {performance} order={i + 1} />
								</li>
							{/each}
						</ul>
					</li>
				{/if}
			{/each}
		</ul>
	</ScrollArea>
{:else}
	<div class="my-7">
		<EmptyState title="No history yet">
			{#snippet description()}
				Log this exercise in a workout to start tracking your progress.
			{/snippet}
		</EmptyState>
	</div>
{/if}
