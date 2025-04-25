<script lang="ts">
	import { triplit } from '$lib/db/triplit';
	import { formatDate } from '$lib/ui/formatDate';
	import { useQuery } from '@triplit/svelte';
	import { ScrollArea } from '$lib/shadcn/scroll-area';
	import type { Workout } from '$lib/db/types';
	import { exists } from '@triplit/client';

	let { exerciseId, currentWorkout }: { exerciseId: string; currentWorkout: Maybe<Workout> } =
		$props();

	let performancesQuery = triplit.query('performances').Where(
		['exerciseId', '=', exerciseId],
		exists('sets', {
			where: [['weight', 'isDefined', true]]
		})
	);

	if (currentWorkout?.id) {
		performancesQuery = performancesQuery.Where(['workoutId', '!=', currentWorkout.id]);
	}

	if (currentWorkout?.date) {
		performancesQuery = performancesQuery.Where(['workout.date', '<=', currentWorkout.date]);
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
						{#each sets as set}
							{@const weight = set.weight}
							{@const reps = set.reps ?? 0}
							{@const duration = set.durationSeconds ?? 0}
							{@const note = set.note}
							<li class="flex w-full items-baseline gap-2 rounded bg-muted/50 p-2">
								<p class="shrink-0 text-sm">
									<span>
										{#if exercise?.executionType === 'reps'}
											{reps}
										{/if}
										{#if exercise?.executionType === 'time'}
											{duration} sec.
										{/if}
									</span>
									<span aria-hidden="true">&times;</span>
									<span>
										{weight}
										{weightUnit}
									</span>
								</p>
								{#if note}
									-
									<p class="text-sm text-muted-foreground">
										{note}
									</p>
								{/if}
							</li>
						{/each}
					</ul>
				</li>
			{/each}
		</ul>
	</ScrollArea>
{:else}
	<div
		class="mb-7 flex grow flex-col items-center justify-center gap-2 rounded-sm border border-dashed p-4"
	>
		<h2 class="text-center text-2xl font-bold">No history yet</h2>
		<p class="text-center font-medium leading-5 text-muted-foreground">
			Log this exercise in a workout to start tracking your progress.
		</p>
	</div>
{/if}
