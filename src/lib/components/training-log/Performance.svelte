<script lang="ts">
	import PerformanceNote from '$lib/components/training-log/PerformanceNote.svelte';
	import PerformanceSets from '$lib/components/training-log/PerformanceSets.svelte';
	import UnitSelector from '$lib/components/ui/UnitSelector.svelte';
	import ExerciseHistoryDialog from '$lib/components/training-log/ExerciseHistoryDialog.svelte';
	import ExerciseInfoDialog from '$lib/components/training-log/ExerciseInfoDialog.svelte';
	import ExerciseSelection from '$lib/components/training-log/ExerciseSelection.svelte';
	import DeletePerformanceDialog from '$lib/components/training-log/DeletePerformanceDialog.svelte';
	import ClosePeformanceButton from '$lib/components/training-log/ClosePeformanceButton.svelte';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import * as Dialog from '$lib/shadcn/dialog';
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
	const formatTargetValue = (value: string, executionType: 'reps' | 'time') => {
		if (/[a-zA-Z]/.test(value)) {
			return value;
		}
		return executionType === 'reps' ? `${value} reps` : `${value} sec`;
	};
	let programTargetSummary = $derived.by(() => {
		const executionType = exercise?.executionType ?? 'reps';
		const plannedValues = sets
			.slice()
			.toSorted((a, b) => a.performanceOrder - b.performanceOrder)
			.map((set) => {
				const targetRange =
					executionType === 'reps'
						? set.programTargetRepsRange?.trim()
						: set.programTargetDuration?.trim();
				if (!targetRange) {
					return null;
				}
				const formattedTarget = formatTargetValue(targetRange, executionType);
				const targetSetRange = set.programTargetSetRange?.trim();
				if (!targetSetRange) {
					return formattedTarget;
				}
				return `${formattedTarget} (${targetSetRange} sets)`;
			})
			.filter((value): value is string => value !== null);

		if (!plannedValues.length) {
			return '';
		}
		return plannedValues.join('; ');
	});

	const onExerciseAdded = async (exerciseId: Id<'exercises'>) => {
		await client.mutation(api.performances.update, {
			id: performance._id,
			exerciseId
		});
	};
</script>

<div class="relative flex flex-col gap-6">
	<div class="flex items-start gap-4">
		<div class="flex min-w-0 grow items-baseline gap-1">
			<div class="flex flex-col items-start gap-0.5">
				<h3 class="leading-5">
					<ExerciseSelection {onExerciseAdded}>
						{#snippet trigger()}
							<Dialog.Trigger
								class={buttonVariants({
									variant: 'ghost',
									class: 'h-auto p-0 text-left text-lg font-semibold hover:bg-transparent'
								})}
							>
								{exerciseName ?? 'Select exercise'}
							</Dialog.Trigger>
						{/snippet}
					</ExerciseSelection>
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
