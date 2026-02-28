<script lang="ts">
	import ExerciseSelection from '$lib/components/training-log/ExerciseSelection.svelte';
	import ProgramTemplateExerciseSetsEditor from '$lib/components/training-log/program-template/ProgramTemplateExerciseSetsEditor.svelte';
	import type { Exercise, ResolvedPerformanceGroup } from '$lib/jazz/types';
	import { Performance, Performance as PerformanceSchema } from '$lib/jazz/schema';
	import Badge from '$lib/shadcn/badge/badge.svelte';
	import { buttonVariants } from '$lib/shadcn/button/button.svelte';
	import * as Dialog from '$lib/shadcn/dialog';
	import Input from '$lib/shadcn/input/input.svelte';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import { deleteCoValues } from 'jazz-tools';

	let {
		group,
		onDeleteGroup
	}: {
		group: ResolvedPerformanceGroup;
		onDeleteGroup: (groupId: string) => void;
	} = $props();

	const performances = $derived(group.performances);
	const exerciseCount = $derived(performances.length);

	const updateGroupLabel = (label: string) => {
		group.$jazz.set('label', label);
	};

	const addExerciseToGroup = (exercise: Exercise) => {
		const newPerformance = PerformanceSchema.create({
			performanceGroupId: group.$jazz.id,
			exercise,
			performanceSets: [],
			groupOrder: performances.length,
			weightUnit: 'lbs'
		});
		performances.$jazz.push(newPerformance);
	};

	const updateExercise = (
		performanceId: string,
		updates: {
			exercise?: Exercise;
			note?: string;
		}
	) => {
		const performance = performances.find((p) => p.$jazz.id === performanceId);
		if (!performance) {
			return;
		}
		if (updates.exercise !== undefined) {
			performance.$jazz.set('exercise', updates.exercise);
		}
		if (updates.note !== undefined) {
			performance.$jazz.set('note', updates.note);
		}
	};

	const removeExercise = (performanceId: string) => {
		deleteCoValues(Performance, performanceId);
	};

	const autoGroupType = $derived.by(() => {
		if (exerciseCount === 2) {
			return 'Superset';
		}
		if (exerciseCount === 3) {
			return 'Triset';
		}
		if (exerciseCount >= 4) {
			return 'Circuit';
		}
		return null;
	});
	const placeholderText = $derived(
		autoGroupType ? `${autoGroupType} name (optional)` : 'Group name'
	);
	const displayBadge = $derived(group.label || autoGroupType);
</script>

<article class="border-border/40 bg-card/20 rounded-lg border">
	{#if exerciseCount > 1}
		<div class="border-border/25 flex items-center gap-2 border-b px-3 py-2.5">
			{#if displayBadge}
				<Badge variant="secondary" class="shrink-0 text-[10px]">
					{displayBadge}
				</Badge>
			{/if}

			<input
				type="text"
				class="placeholder:text-muted-foreground/50 min-w-0 flex-1 bg-transparent text-xs font-medium outline-none"
				placeholder={placeholderText}
				value={group.label ?? ''}
				oninput={(e) => updateGroupLabel(e.currentTarget.value)}
			/>
			<button
				type="button"
				class="text-muted-foreground/50 hover:text-destructive shrink-0 transition-colors"
				onclick={() => onDeleteGroup(group.$jazz.id)}
			>
				<TrashIcon class="size-3.5" />
			</button>
		</div>
	{/if}

	<div class="px-3 py-3">
		{#if exerciseCount > 0}
			<div class="space-y-4">
				{#each performances as performance, index (performance.$jazz.id)}
					{@const exercise = performance.exercise.$isLoaded ? performance.exercise : null}
					<div class="space-y-2">
						<div class="flex items-start gap-2">
							<div class="min-w-0 flex-1 space-y-1.5">
								<ExerciseSelection
									onExerciseAdded={(exercise) => updateExercise(performance.$jazz.id, { exercise })}
								>
									{#snippet trigger()}
										<Dialog.Trigger
											class={buttonVariants({
												variant: 'outline',
												size: 'sm',
												class: 'h-8 w-full justify-start text-xs'
											})}
										>
											{exercise?.name ?? 'Select exercise'}
										</Dialog.Trigger>
									{/snippet}
								</ExerciseSelection>
								<Input
									class="h-8 text-xs"
									placeholder="Exercise note"
									value={performance.note ?? ''}
									oninput={(e) =>
										updateExercise(performance.$jazz.id, { note: e.currentTarget.value })}
								/>
							</div>
							<button
								type="button"
								class="text-muted-foreground/40 hover:text-destructive mt-1 shrink-0 transition-colors"
								onclick={() => removeExercise(performance.$jazz.id)}
							>
								<TrashIcon class="size-3.5" />
							</button>
						</div>

						<ProgramTemplateExerciseSetsEditor
							performanceId={performance.$jazz.id}
							executionType={exercise?.executionType ?? 'reps'}
						/>
					</div>
					{#if index < exerciseCount - 1}
						<div class="border-border/15 border-t"></div>
					{/if}
				{/each}
			</div>
		{:else}
			<p class="text-muted-foreground/50 py-2 text-xs">No exercises yet</p>
		{/if}

		<ExerciseSelection onExerciseAdded={addExerciseToGroup}>
			{#snippet trigger()}
				<Dialog.Trigger
					class={buttonVariants({
						variant: 'ghost',
						size: 'sm',
						class: 'text-muted-foreground mt-2 h-8 w-full text-xs'
					})}
				>
					<PlusIcon class="size-3.5" />
					Add exercise
				</Dialog.Trigger>
			{/snippet}
		</ExerciseSelection>
	</div>
</article>
