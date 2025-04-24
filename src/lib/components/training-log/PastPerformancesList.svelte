<script lang="ts">
	import { triplit } from '$lib/db/triplit';
	import { formatDate } from '$lib/ui/formatDate';
	import { useQuery } from '@triplit/svelte';

	let { exerciseId, upToDate }: { exerciseId: string; upToDate?: Maybe<Date> } = $props();

	const query = useQuery(
		triplit,
		triplit
			.query('performances')
			.Where([['exerciseId', '=', exerciseId], upToDate ? ['workout.date', '<', upToDate] : false])
			.Order('workout.date', 'DESC')
			.Limit(10)
			.Include('sets', (setsRel) => {
				return setsRel('sets')
					.Order('performanceOrder', 'ASC')
					.Where(['weight', 'isDefined', true]);
			})
			.Include('workout')
			.Include('exercise')
	);

	let performances = $derived(query.results ?? []);
</script>

<ul class="flex flex-col gap-4 divide-y divide-border pt-4">
	{#each performances as performance (performance.id)}
		{@const date = formatDate(performance.workout?.date)}
		{@const sets = performance.sets ?? []}
		{@const exercise = performance.exercise}
		{@const weightUnit = performance.weightUnit}
		<li class="flex flex-col gap-2 pt-4">
			<h4 class="text-base font-semibold">{date}</h4>
			<ul class="flex flex-col gap-2">
				{#each sets as set}
					{@const weight = set.weight}
					{@const reps = set.reps ?? 0}
					{@const duration = set.durationSeconds ?? 0}
					{@const note = set.note}
					<li class="w-full rounded bg-muted/50 p-2">
						<p class="text-sm">
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
							<p class="text-sm text-muted-foreground">{note}</p>
						{/if}
					</li>
				{/each}
			</ul>
		</li>
	{/each}
</ul>
