<script lang="ts">
	import { exerciseLoadType } from '$lib/db/exerciseLoadType';
	import type { Exercise, PerformanceSet } from '$lib/db/types';
	import Input from '$lib/shadcn/input/input.svelte';
	import Label from '$lib/shadcn/label/label.svelte';
	import type { WeightUnit } from '$lib/types';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { Textarea } from '$lib/shadcn/textarea';

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
	class="focus-within:bg-primary/5 bg-muted/30 flex flex-col gap-2 rounded-lg p-2 transition-colors"
>
	<div class="flex items-center gap-3">
		<!-- Set number indicator -->
		{#if order}
			<div
				class="text-muted-foreground bg-muted flex size-8 shrink-0 translate-y-2 items-center justify-center rounded-full text-sm font-medium"
			>
				{order}
			</div>
		{/if}

		<!-- Input fields container -->
		<div class="flex flex-1 items-center gap-3">
			<Label class="flex flex-1 flex-col gap-1">
				<span class="text-muted-foreground text-[10px] font-medium">
					{#if executionType === 'reps'}
						Reps
					{:else}
						Time (sec)
					{/if}
				</span>
				<Input
					type="number"
					value={executionType === 'reps' ? reps : durationSeconds}
					oninput={executionType === 'reps' ? onRepsChange : onTimeChange}
					min="0"
					class="h-11 w-full text-center text-lg font-semibold"
				/>
			</Label>
			<!-- Separator -->
			<div class="text-muted-foreground translate-y-2 text-lg" aria-hidden="true">&times;</div>
			<!-- Weight input -->
			<Label class="relative flex flex-1 flex-col gap-1">
				<span class="text-muted-foreground text-[10px] font-medium">
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
	<Label>
		<span class="sr-only">Set note</span>
		<Textarea
			rows={1}
			class="min-h-none text-sm font-normal"
			placeholder="Note (RIR, RPE, etc.)"
			value={set.note}
			oninput={(event) => {
				client.mutation(api.performanceSets.update, {
					id: set._id,
					note: event.currentTarget.value
				});
			}}
		/>
	</Label>
</div>
