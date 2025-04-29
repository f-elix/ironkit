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

	let totalWeight = $derived.by(() => {
		if (loadType === 'bodyweight') {
			return bodyweight + weight;
		}
		return weight;
	});
</script>

<div class="flex w-full items-baseline gap-2">
	<div
		class="grid size-5 shrink-0 place-items-center rounded-full bg-foreground text-sm font-bold text-background"
	>
		{order}
	</div>
	<div class="flex w-full flex-col gap-1 rounded border border-foreground/50 p-2 text-sm">
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
					{bodyweight}
					{#if bodyweightUnit !== weightUnit}
						{bodyweightUnit}
					{/if}
					{#if weight > 0}
						+ {weight}
					{:else if weight < 0}
						- {Math.abs(weight)}
					{/if}
					{#if weight}
						{weightUnit}
						({totalWeight}
						{weightUnit})
					{:else}
						{weightUnit}
					{/if}
				{:else}
					{weight}
					{weightUnit}
				{/if}
			</span>
		</p>
		{#if note}
			<p class="text-sm text-muted-foreground">
				{note}
			</p>
		{/if}
	</div>
</div>
