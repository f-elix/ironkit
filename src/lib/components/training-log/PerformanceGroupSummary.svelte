<script lang="ts">
	import Badge from '$lib/shadcn/badge/badge.svelte';
	import type { WorkoutWithRelations } from '$lib/db/types';

	type PerformanceGroup = WorkoutWithRelations['performanceGroups'][number];

	let { performanceGroup }: { performanceGroup: PerformanceGroup } = $props();

	let label = $derived(performanceGroup.label);
	let performances = $derived(performanceGroup.performances);
</script>

<div class="flex w-full flex-col items-start gap-4 whitespace-normal py-2 text-left">
	{#if label}
		<p class="font-semibold text-muted-foreground">{label}</p>
	{/if}
	{#each performances as performance (performance.id)}
		{@const exercise = performance.exercise}
		{@const sets = performance.sets?.filter((set) => !!set.weight) ?? []}
		{@const weightUnit = performance.weightUnit}
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
						{@const weight = set.weight}
						{@const reps = set.reps ?? 0}
						{@const duration = set.durationSeconds ?? 0}
						{@const note = set.note}
						<li class="flex w-full items-baseline gap-2">
							<div class="text-sm">{i + 1}</div>
							<div class="flex w-full items-baseline gap-2 rounded bg-background/80 p-2 text-sm">
								<p class="shrink-0">
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
							</div>
						</li>
					{/each}
				</ol>
			{/if}
		</div>
	{/each}
</div>
