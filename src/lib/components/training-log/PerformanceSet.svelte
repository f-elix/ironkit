<script lang="ts">
	import { exerciseLoadType } from '$lib/db/exerciseLoadType';
	import type { Exercise, PerformanceSet } from '$lib/db/types';
	import Input from '$lib/shadcn/input/input.svelte';
	import Label from '$lib/shadcn/label/label.svelte';
	import type { WeightUnit } from '$lib/types';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';

	let {
		set,
		unit,
		exercise,
		order
	}: { set: PerformanceSet; unit: WeightUnit; exercise: Maybe<Exercise>; order?: number } =
		$props();

	const client = useConvexClient();
	const executionType = exercise?.executionType ?? 'reps';
	const loadType = exerciseLoadType(exercise) ?? 'weighted';
	const weight = set.weight;
	const reps = set.reps;
	const durationSeconds = set.durationSeconds;

	const onWeightChange = (event: Event) => {
		const value = (event.target as HTMLInputElement).value;
		const valueAsNumber = parseFloat(value);
		client.mutation(api.performanceSets.update, { id: set._id, weight: valueAsNumber || 0 });
	};

	const onRepsChange = (event: Event) => {
		const value = (event.target as HTMLInputElement).valueAsNumber || 0;
		client.mutation(api.performanceSets.update, { id: set._id, reps: value });
	};

	const onTimeChange = (event: Event) => {
		const value = (event.target as HTMLInputElement).valueAsNumber || 0;
		client.mutation(api.performanceSets.update, { id: set._id, durationSeconds: value });
	};
</script>

<!-- Set input row with larger touch targets and focus feedback -->
<div
	class="focus-within:bg-primary/5 focus-within:ring-primary/20 bg-muted/30 flex items-center gap-3 rounded-lg p-2 transition-colors focus-within:ring-1"
>
	<!-- Set number indicator -->
	{#if order}
		<div
			class="text-muted-foreground bg-muted flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium"
		>
			{order}
		</div>
	{/if}

	<!-- Input fields container -->
	<div class="flex flex-1 items-center gap-3">
		{#if executionType === 'reps'}
			<Label class="flex flex-1 flex-col gap-1">
				<span class="text-muted-foreground text-xs font-medium">Reps</span>
				<Input
					type="number"
					value={reps}
					oninput={onRepsChange}
					min="0"
					class="h-11 w-full text-center text-lg font-semibold"
				/>
			</Label>
		{/if}
		{#if executionType === 'time'}
			<Label class="flex flex-1 flex-col gap-1">
				<span class="text-muted-foreground text-xs font-medium">Time (sec)</span>
				<Input
					type="number"
					value={durationSeconds}
					oninput={onTimeChange}
					min="0"
					class="h-11 w-full text-center text-lg font-semibold"
				/>
			</Label>
		{/if}

		<!-- Separator -->
		<div class="text-muted-foreground translate-y-2 text-lg" aria-hidden="true">&times;</div>

		<!-- Weight input -->
		<Label class="relative flex flex-1 flex-col gap-1">
			<span class="text-muted-foreground text-xs font-medium">
				{loadType === 'bodyweight' ? `+${unit}` : unit}
			</span>
			<div class="relative">
				{#if loadType === 'bodyweight'}
					<div class="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-lg">
						+
					</div>
				{/if}
				<Input
					type="text"
					value={weight}
					oninput={onWeightChange}
					inputmode="decimal"
					pattern="-?[0-9]*[.,]?[0-9]*"
					class="h-11 w-full text-center text-lg font-semibold {loadType === 'bodyweight'
						? 'pl-7'
						: ''}"
				/>
			</div>
		</Label>
	</div>
</div>
