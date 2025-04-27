<script lang="ts">
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

	let executionType = $state(exercise?.executionType ?? 'reps');
	let weight = $state(set.weight);
	let reps = $state(set.reps);
	let durationSeconds = $state(set.durationSeconds);

	const onWeightChange = (event: Event) => {
		const value = (event.target as HTMLInputElement).valueAsNumber;
		triplit.update('performanceSets', set.id, { weight: value });
	};

	const onRepsChange = (event: Event) => {
		const value = (event.target as HTMLInputElement).valueAsNumber;
		triplit.update('performanceSets', set.id, { reps: value });
	};

	const onTimeChange = (event: Event) => {
		const value = (event.target as HTMLInputElement).valueAsNumber;
		triplit.update('performanceSets', set.id, { durationSeconds: value });
	};
</script>

<div class="flex items-center gap-2">
	{#if executionType === 'reps'}
		<Label class="flex items-center gap-2">
			<span class="sr-only">Reps</span>
			<Input type="number" value={reps} oninput={onRepsChange} class="w-20" />
		</Label>
	{/if}
	{#if executionType === 'time'}
		<Label class="flex items-center gap-2">
			<span class="sr-only">Time</span>
			<Input type="number" value={durationSeconds} oninput={onTimeChange} class="w-20" />
			<span>sec.</span>
		</Label>
	{/if}
	<div aria-hidden="true">&times;</div>
	<Label class="flex items-center gap-2">
		<span class="sr-only">Weight</span>
		<Input type="number" value={weight} oninput={onWeightChange} class="w-24  pr-8" />
		<span class="-ml-10 opacity-80">{unit}</span>
	</Label>
</div>
