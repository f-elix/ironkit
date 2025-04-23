<script lang="ts">
	import Badge from '$lib/shadcn/badge/badge.svelte';
	import type { WorkoutWithRelations } from '$lib/db/types';

	type PerformanceGroup = WorkoutWithRelations['performanceGroups'][number];

	let { performanceGroup }: { performanceGroup: PerformanceGroup } = $props();

	let label = $derived(performanceGroup.label);
	let performances = $derived(performanceGroup.performances);
</script>

<div class="flex w-full flex-col items-start gap-4 py-2 text-left">
	{#if label}
		<p>{label}</p>
	{/if}
	{#each performances as performance (performance.id)}
		{@const exercise = performance.exercise}
		{@const sets = performance.sets?.filter((set) => !!set.weight) ?? []}
		{@const weightUnit = performance.weightUnit}
		{@const note = performance.note}
		<div class="flex flex-col gap-4">
			<div>
				<p class="text-lg font-semibold">
					{exercise?.name}
				</p>
				{#if note}
					<p class="whitespace-normal text-sm text-muted-foreground">{note}</p>
				{/if}
			</div>
			{#if sets.length}
				<ul class="flex flex-col gap-2">
					{#each sets as set (set.id)}
						{@const weight = set.weight}
						{@const reps = set.reps ?? 0}
						{@const duration = set.durationSeconds ?? 0}
						{@const note = set.note}
						<li class="grid grid-cols-2 items-baseline gap-2">
							<Badge class="flex items-center justify-center gap-2 text-sm">
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
							</Badge>
							{#if note}
								<p class="whitespace-normal text-base font-normal">{note}</p>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/each}
</div>
