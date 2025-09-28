<script lang="ts">
	import PerformanceSetSummary from '$lib/components/training-log/PerformanceSetSummary.svelte';
	import { triplit } from '$lib/db/triplit';
	import Badge from '$lib/shadcn/badge/badge.svelte';
	import { or } from '@triplit/client';
	import { useQueryOne } from '@triplit/svelte';

	let { performanceGroupId }: { performanceGroupId: string } = $props();

	const query = useQueryOne(
		triplit,
		triplit
			.query('performanceGroups')
			.Where('id', '=', performanceGroupId)
			.Include('performances', (performancesRel) => {
				return performancesRel('performances')
					.Order('groupOrder', 'ASC')
					.Include('exercise')
					.Include('sets', (setsRel) => {
						return setsRel('sets')
							.Where(
								or([
									['weight', '>', 0],
									['reps', '>', 0],
									['durationSeconds', '>', 0]
								])
							)
							.Order('performanceOrder', 'ASC');
					})
					.Include('workout');
			})
	);

	let performanceGroup = $derived(query.result);
	let label = $derived(performanceGroup?.label);
	let performances = $derived(performanceGroup?.performances ?? []);
</script>

<div class="flex w-full flex-col items-start gap-4 py-2 text-left whitespace-normal">
	{#if label && performances.length > 1}
		<Badge>{label}</Badge>
	{/if}
	{#each performances as performance (performance.id)}
		{@const exercise = performance.exercise}
		{@const sets = performance.sets ?? []}
		{@const note = performance.note}
		<div class="flex w-full flex-col gap-4">
			<div>
				<p class="text-base font-semibold">
					{exercise?.name}
				</p>
				{#if note}
					<p class="text-muted-foreground text-sm whitespace-normal">{note}</p>
				{/if}
			</div>
			{#if sets.length}
				<ol class="flex flex-col gap-2">
					{#each sets as set, i (set.id)}
						<li>
							<PerformanceSetSummary {set} {performance} order={i + 1} />
						</li>
					{/each}
				</ol>
			{/if}
		</div>
	{/each}
</div>
