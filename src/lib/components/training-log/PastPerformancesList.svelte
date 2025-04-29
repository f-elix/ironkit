<script lang="ts">
	import { triplit } from '$lib/db/triplit';
	import { formatDate } from '$lib/ui/formatDate';
	import { useQuery } from '@triplit/svelte';
	import { ScrollArea } from '$lib/shadcn/scroll-area';
	import type { Workout } from '$lib/db/types';
	import { exists } from '@triplit/client';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { today } from '@internationalized/date';
	import { TIMEZONE } from '$lib/constants';
	import PerformanceSetSummary from '$lib/components/training-log/PerformanceSetSummary.svelte';

	let { exerciseId, currentWorkout }: { exerciseId: string; currentWorkout?: Maybe<Workout> } =
		$props();

	let performancesQuery = triplit.query('performances').Where(
		['exerciseId', '=', exerciseId],
		exists('sets', {
			where: [['weight', 'isDefined', true]]
		})
	);

	if (currentWorkout) {
		performancesQuery = performancesQuery.Where(
			['workoutId', '!=', currentWorkout.id],
			['workout.date', '<=', currentWorkout.date]
		);
	} else {
		performancesQuery = performancesQuery.Where([
			'workout.date',
			'<',
			today(TIMEZONE).toDate(TIMEZONE)
		]);
	}

	const query = useQuery(
		triplit,
		performancesQuery
			.Order('workout.date', 'DESC')
			.Limit(10)
			.Include('sets', (setsRel) => {
				return setsRel('sets').Order('performanceOrder', 'ASC');
			})
			.Include('workout')
			.Include('exercise')
	);

	let performances = $derived(query.results ?? []);
</script>

{#if performances.length}
	<ScrollArea class="h-[50vh]">
		<ul class="flex flex-col gap-4 divide-y divide-border pb-7 pt-4">
			{#each performances as performance (performance.id)}
				{@const date = formatDate(performance.workout?.date)}
				{@const sets = performance.sets ?? []}
				{@const exercise = performance.exercise}
				{@const weightUnit = performance.weightUnit}
				{@const note = performance.note}
				<li class="flex flex-col gap-3 pt-4">
					<div class="flex flex-col gap-1">
						<h4 class="text-base font-semibold">{date}</h4>
						{#if note}
							<p class="text-sm text-muted-foreground">{note}</p>
						{/if}
					</div>
					<ul class="flex flex-col gap-2">
						{#each sets as set, i (set.id)}
							<li class="flex w-full items-baseline gap-2">
								<PerformanceSetSummary {set} {performance} order={i + 1} />
							</li>
						{/each}
					</ul>
				</li>
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
