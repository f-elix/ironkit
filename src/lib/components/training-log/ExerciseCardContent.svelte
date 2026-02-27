<script lang="ts">
	import ExerciseSelection from './ExerciseSelection.svelte';
	import * as Dialog from '$lib/shadcn/dialog';
	import { buttonVariants } from '$lib/shadcn/button';
	import Plus from '@lucide/svelte/icons/plus';
	import ExerciseSetRow from './ExerciseSetRow.svelte';
	import ExerciseCardExerciseRow from './ExerciseCardExerciseRow.svelte';
	import { addExerciseToPerformanceGroup } from '$lib/training-log/addExerciseToPerformanceGroup';
	import Label from '$lib/shadcn/label/label.svelte';
	import Input from '$lib/shadcn/input/input.svelte';
	import Button from '$lib/shadcn/button/button.svelte';
	import type { ResolvedPerformanceGroup } from '$lib/jazz/types';
	import ExerciseCardTargetSummary from '$lib/components/training-log/ExerciseCardTargetSummary.svelte';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { PerformanceSet } from '$lib/jazz/schema';
	import type { Exercise } from '$lib/jazz/types';

	let {
		performanceGroup,
		onNext,
		onRemoveGroup
	}: {
		performanceGroup: ResolvedPerformanceGroup;
		onNext?: () => void;
		onRemoveGroup?: () => void;
	} = $props();

	const performances = $derived(
		performanceGroup.$isLoaded ? performanceGroup.performances.filter((p) => p.$isLoaded) : []
	);

	const onExerciseAdded = async (exercise: Exercise) => {
		addExerciseToPerformanceGroup(performanceGroup, exercise);
	};

	const onLabelChange = async (event: Event) => {
		const value = (event.currentTarget as HTMLInputElement).value;
		performanceGroup.$jazz.set('label', value);
	};

	const onDeletePerformance = async (performanceId: string) => {
		if (!performanceGroup.performances.$isLoaded) {
			return;
		}
		performanceGroup.performances.$jazz.remove((p) => p.$jazz.id === performanceId);
	};
</script>

<div class="flex flex-col gap-4 p-4">
	<!-- Group label input for multi-exercise groups -->
	{#if performances.length > 1}
		<Label class="flex-1">
			<span class="sr-only">Group title</span>
			<Input
				type="text"
				placeholder={performanceGroup.label ? '' : 'Group name (optional)'}
				value={performanceGroup.label ?? ''}
				oninput={onLabelChange}
				class="text-sm font-medium"
			/>
		</Label>
	{/if}

	<!-- Exercise performances -->
	{#each performances as performance (performance.$jazz.id)}
		{@const performanceSets = performance.performanceSets.$isLoaded
			? performance.performanceSets.filter((s) => s.$isLoaded)
			: []}
		{@const exercise = performance.exercise.$isLoaded ? performance.exercise : null}
		<div class="flex flex-col gap-2">
			<ExerciseCardExerciseRow
				{performance}
				showDeleteButton={performances.length > 1}
				onDelete={onDeletePerformance}
			/>
			<ExerciseCardTargetSummary {performance} />

			<!-- Sets -->
			{#if performanceSets.length > 0}
				<div class="flex flex-col gap-2">
					{#each performanceSets as set, setIndex (set.$jazz.id)}
						<ExerciseSetRow
							{set}
							{setIndex}
							unit={performance.weightUnit ?? 'lbs'}
							{exercise}
							previousSet={setIndex > 0 ? performanceSets[setIndex - 1] : null}
							onDelete={() => {
								if (performance.performanceSets.$isLoaded) {
									performance.performanceSets.$jazz.remove((s) => s.$jazz.id === set.$jazz.id);
								}
							}}
						/>
					{/each}
				</div>
			{/if}

			<!-- Add set button -->
			<Button
				variant="secondary"
				size="sm"
				class="w-full"
				onclick={() => {
					if (!performance.performanceSets.$isLoaded) {
						return;
					}
					const lastSet = performanceSets.at(-1);
					const order = lastSet ? lastSet.performanceOrder + 1 : 1;
					const newSet = PerformanceSet.create({
						weight: undefined,
						reps: undefined,
						durationSeconds: undefined,
						note: undefined,
						performanceOrder: order,
						updatedAt: new Date()
					});
					performance.performanceSets.$jazz.push(newSet);
				}}
			>
				<Plus class="mr-1 size-4" />
				Add set
			</Button>
		</div>
	{/each}

	<!-- Add exercise button -->
	<ExerciseSelection {onExerciseAdded}>
		{#snippet trigger()}
			<Dialog.Trigger class={buttonVariants({ variant: 'secondary', class: 'w-full' })}>
				<Plus class="mr-1 size-4" />
				Add exercise to group
			</Dialog.Trigger>
		{/snippet}
	</ExerciseSelection>

	<div class="border-border -mx-4 mt-2 border-t px-4 pt-3">
		<div class="flex gap-2">
			<Button variant="destructive" class="flex-1" onclick={onRemoveGroup}>
				<Trash2 class="mr-1 size-4" />
				Remove
			</Button>
			{#if onNext}
				<Button variant="secondary" class="flex-1" onclick={onNext}>
					Next
					<ChevronRight class="size-4" />
				</Button>
			{/if}
		</div>
	</div>
</div>
