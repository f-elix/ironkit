<script lang="ts">
	import PerformanceNote from '$lib/components/training-log/PerformanceNote.svelte';
	import PerformanceSets from '$lib/components/training-log/PerformanceSets.svelte';
	import UnitSelector from '$lib/components/ui/UnitSelector.svelte';
	import ExerciseHistoryDialog from '$lib/components/training-log/ExerciseHistoryDialog.svelte';
	import ExerciseInfoDialog from '$lib/components/training-log/ExerciseInfoDialog.svelte';
	import DeletePerformanceDialog from '$lib/components/training-log/DeletePerformanceDialog.svelte';
	import ClosePeformanceButton from '$lib/components/training-log/ClosePeformanceButton.svelte';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { Dialog } from 'bits-ui';
	import { buttonVariants } from '$lib/shadcn/button';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import type { WorkoutWithRelations } from '$lib/db/types';
	import type { Id } from '$convex/_generated/dataModel';

	type Performance = WorkoutWithRelations['performanceGroups'][number]['performances'][number];

	let {
		performance,
		onDelete,
		showCloseButton
	}: {
		performance: Performance;
		onDelete: (performanceId: Id<'performances'>) => void;
		showCloseButton: boolean;
	} = $props();

	const client = useConvexClient();
	let exercise = $derived(performance.exercise);
	let exerciseName = $derived(exercise?.name);
	let workout = $derived(performance.workout);
	let unit = $derived(performance.weightUnit);
	let sets = $derived(performance.sets ?? []);
	let bodyweight = $derived(
		workout?.bodyweight ? `${workout?.bodyweight} ${workout?.bodyweightUnit}` : ''
	);
	let programTargetSummary = $derived.by(() => {
		const executionType = exercise?.executionType ?? 'reps';
		const plannedValues = sets
			.slice()
			.sort((a, b) => a.performanceOrder - b.performanceOrder)
			.map((set) =>
				executionType === 'time' ? set.programTargetDurationSeconds : set.programTargetReps
			)
			.filter((value): value is number => value != null);

		if (!plannedValues.length) {
			return '';
		}
		const unitLabel = executionType === 'time' ? 'sec' : 'reps';
		const uniqueValues = [...new Set(plannedValues)];
		if (uniqueValues.length === 1) {
			return `${plannedValues.length} set${plannedValues.length > 1 ? 's' : ''} x ${uniqueValues[0]} ${unitLabel}`;
		}
		return `${plannedValues.length} set${plannedValues.length > 1 ? 's' : ''} (${plannedValues.join('/')} ${unitLabel})`;
	});
</script>

<div class="relative flex flex-col gap-6">
	<div class="flex items-start gap-4">
		<div class="flex min-w-0 grow items-baseline gap-1">
			<div class="flex flex-col items-start gap-0.5">
				<h3 class="text-lg leading-5 font-semibold">
					{exerciseName}
				</h3>
				{#if exercise?.loadType === 'bodyweight'}
					<h4 class="text-sm opacity-70">
						Bodyweight
						{#if bodyweight}
							({bodyweight})
						{/if}
					</h4>
				{/if}
				{#if programTargetSummary}
					<p class="text-primary text-xs font-medium">Planned: {programTargetSummary}</p>
				{/if}
			</div>
			{#if exercise}
				<ExerciseInfoDialog {exercise}>
					{#snippet trigger()}
						<Dialog.Trigger
							class={buttonVariants({ variant: 'ghost', size: 'icon', class: 'size-7 shrink-0' })}
							aria-label="Edit {exerciseName}"
						>
							<PencilIcon class="size-3.5" />
						</Dialog.Trigger>
					{/snippet}
				</ExerciseInfoDialog>
			{/if}
		</div>
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
