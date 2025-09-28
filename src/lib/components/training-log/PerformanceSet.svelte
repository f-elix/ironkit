<script lang="ts">
	import { exerciseLoadType } from '$lib/db/exerciseLoadType';
	import { triplit } from '$lib/db/triplit';
	import type { Exercise, PerformanceSet } from '$lib/db/types';
	import Input from '$lib/shadcn/input/input.svelte';
	import Label from '$lib/shadcn/label/label.svelte';
	import type { WeightUnit } from '$lib/types';

	let {
		set,
		unit,
		exercise
	}: { set: PerformanceSet; unit: WeightUnit; exercise: Maybe<Exercise> } = $props();

	const executionType = exercise?.executionType ?? 'reps';
	const loadType = exerciseLoadType(exercise) ?? 'weighted';
	const weight = set.weight;
	const reps = set.reps;
	const durationSeconds = set.durationSeconds;

	const onWeightChange = (event: Event) => {
		const value = (event.target as HTMLInputElement).value;
		const valueAsNumber = parseFloat(value);
		triplit.update('performanceSets', set.id, { weight: valueAsNumber || 0 });
	};

	const onRepsChange = (event: Event) => {
		const value = (event.target as HTMLInputElement).valueAsNumber || 0;
		triplit.update('performanceSets', set.id, { reps: value });
	};

	const onTimeChange = (event: Event) => {
		const value = (event.target as HTMLInputElement).valueAsNumber || 0;
		triplit.update('performanceSets', set.id, { durationSeconds: value });
	};
</script>

<div class="flex items-center gap-2 whitespace-nowrap">
	{#if executionType === 'reps'}
		<Label class="flex items-center">
			<span class="sr-only">Reps</span>
			<Input type="number" value={reps} oninput={onRepsChange} min="0" class="w-16" />
		</Label>
	{/if}
	{#if executionType === 'time'}
		<Label class="flex items-center gap-1">
			<span class="sr-only">Time</span>
			<Input type="number" value={durationSeconds} oninput={onTimeChange} min="0" class="w-20" />
			<span>sec</span>
		</Label>
	{/if}
	<div aria-hidden="true">&times;</div>
	<Label class="relative flex w-28 items-center">
		<span class="sr-only">Weight</span>
		{#if loadType === 'bodyweight'}
			<div class="absolute left-2 opacity-70">+</div>
		{/if}
		<Input
			type="text"
			value={weight}
			oninput={onWeightChange}
			step="0.01"
			inputmode="numeric"
			pattern="-?[0-9]*[.,]?[0-9]*"
			class={['w-full pr-8', loadType === 'bodyweight' && 'pl-5']}
		/>
		<span class="absolute right-2 opacity-70">{unit}</span>
	</Label>
</div>
