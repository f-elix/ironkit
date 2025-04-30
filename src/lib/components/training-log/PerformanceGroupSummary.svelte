<script lang="ts">
	import PerformanceSetSummary from '$lib/components/training-log/PerformanceSetSummary.svelte';
	import type { WorkoutWithRelations } from '$lib/db/types';
	import Badge from '$lib/shadcn/badge/badge.svelte';

	type PerformanceGroup = WorkoutWithRelations['performanceGroups'][number];

	let { performanceGroup }: { performanceGroup: PerformanceGroup } = $props();

	let label = $derived(performanceGroup.label);
	let performances = $derived(performanceGroup.performances);
</script>

<div class="flex w-full flex-col items-start gap-4 whitespace-normal py-2 text-left">
	{#if label}
		<Badge>{label}</Badge>
	{/if}
	{#each performances as performance (performance.id)}
		{@const exercise = performance.exercise}
		{@const sets =
			performance.sets?.filter((set) => !!set.weight || !!set.reps || !!set.durationSeconds) ?? []}
		{@const note = performance.note}
		<div class="flex w-full flex-col gap-4">
			<div>
				<p class="text-base font-semibold">
					{exercise?.name}
				</p>
				{#if note}
					<p class="whitespace-normal text-sm text-muted-foreground">{note}</p>
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
