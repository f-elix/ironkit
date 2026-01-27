<script lang="ts">
	import PerformanceNote from '$lib/components/training-log/PerformanceNote.svelte';
	import PerformanceSets from '$lib/components/training-log/PerformanceSets.svelte';
	import UnitSelector from '$lib/components/ui/UnitSelector.svelte';
	import ExerciseHistoryDialog from '$lib/components/training-log/ExerciseHistoryDialog.svelte';
	import DeletePerformanceDialog from '$lib/components/training-log/DeletePerformanceDialog.svelte';
	import ClosePeformanceButton from '$lib/components/training-log/ClosePeformanceButton.svelte';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import type { WorkoutWithRelations } from '$lib/db/types';

	type Performance = WorkoutWithRelations['performanceGroups'][number]['performances'][number];

	let {
		performance,
		onDelete,
		showCloseButton
	}: {
		performance: Performance;
		onDelete: (performanceId: string) => void;
		showCloseButton: boolean;
	} = $props();

	const client = useConvexClient();
	let exerciseName = $derived(performance.exercise?.name);
	let workout = $derived(performance.workout);
	let unit = $derived(performance.weightUnit);
	let bodyweight = $derived(
		workout?.bodyweight ? `${workout?.bodyweight} ${workout?.bodyweightUnit}` : ''
	);
</script>

<div class="relative flex flex-col gap-6">
	<div class="flex items-start gap-4">
		<h3 class="grow text-lg leading-5 font-semibold">
			{exerciseName}
			{#if performance.exercise?.loadType === 'bodyweight'}
				<span class="text-sm opacity-70">
					- bodyweight
					{#if bodyweight}
						({bodyweight})
					{/if}
				</span>
			{/if}
		</h3>
		<div class="flex gap-2">
			<DeletePerformanceDialog onConfirm={() => onDelete(performance._id)} />
			{#if showCloseButton}
				<ClosePeformanceButton size="sm" />
			{/if}
		</div>
	</div>
	<div class="flex flex-col gap-6">
		<div class="flex items-start justify-between gap-2">
			<div class="grow">
				<PerformanceNote {performance} />
			</div>
			<div class="flex items-center gap-1">
				<UnitSelector
					value={unit}
					onValueChange={(unit) => {
						client.mutation(api.performances.update, {
							id: performance._id,
							weightUnit: unit
						});
					}}
				/>
				<ExerciseHistoryDialog
					exerciseId={performance.exerciseId}
					currentWorkout={performance.workout}
				/>
			</div>
		</div>
		<PerformanceSets {performance} />
	</div>
</div>
