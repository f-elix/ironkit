<script lang="ts">
	import { DEFAULT_EXERCISE_EXECUTION_TYPE, DEFAULT_EXERCISE_LOAD_TYPE } from '$lib/constants';
	import type { PerformanceSet, WorkoutWithRelations } from '$lib/db/types';

	type Performance = WorkoutWithRelations['performanceGroups'][number]['performances'][number];

	let {
		set,
		performance,
		order
	}: { set: PerformanceSet; performance: Performance; order: number } = $props();

	let weight = $derived(set.weight ?? 0);
	let reps = $derived(set.reps ?? 0);
	let duration = $derived(set.durationSeconds ?? 0);
	let note = $derived(set.note);

	let weightUnit = $derived(performance.weightUnit);
	let workout = $derived(performance.workout);
	let bodyweight = $derived(workout?.bodyweight ?? 0);
	let bodyweightUnit = $derived(workout?.bodyweightUnit ?? 'lbs');
	let exercise = $derived(performance.exercise);
	let executionType = $derived(exercise?.executionType ?? DEFAULT_EXERCISE_EXECUTION_TYPE);
	let loadType = $derived(exercise?.loadType ?? DEFAULT_EXERCISE_LOAD_TYPE);
</script>

<div class="flex w-full items-baseline gap-2">
	<div
		class="bg-foreground text-background grid size-5 shrink-0 place-items-center rounded-full text-sm font-bold"
	>
		{order}
	</div>
	<div class="border-foreground/50 flex w-full flex-col gap-1 rounded border p-2 text-sm">
		<p class="shrink-0">
			<span>
				{#if executionType === 'reps'}
					{reps}
				{/if}
				{#if executionType === 'time'}
					{duration} sec.
				{/if}
			</span>
			<span aria-hidden="true">&times;</span>
			<span>
				{#if loadType === 'bodyweight'}
					bodyweight ({bodyweight}
					{bodyweightUnit})
					{#if weight > 0}
						+ {weight}
					{:else if weight < 0}
						- {Math.abs(weight)}
					{/if}
					{#if weight}
						{weightUnit}
					{/if}
				{:else}
					{weight}
					{weightUnit}
				{/if}
			</span>
		</p>
		{#if note}
			<p class="text-muted-foreground text-sm">
				{note}
			</p>
		{/if}
	</div>
</div>
