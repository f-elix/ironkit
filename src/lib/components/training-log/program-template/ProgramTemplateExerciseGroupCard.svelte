<script lang="ts">
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import ExerciseSelection from '$lib/components/training-log/ExerciseSelection.svelte';
	import ProgramTemplateExerciseSetsEditor from '$lib/components/training-log/program-template/ProgramTemplateExerciseSetsEditor.svelte';
	import type {
		GroupExerciseUpdate,
		ProgramWorkoutGroup
	} from '$lib/components/training-log/program-template/program-template-editor.types';
	import Badge from '$lib/shadcn/badge/badge.svelte';
	import { buttonVariants } from '$lib/shadcn/button/button.svelte';
	import * as Dialog from '$lib/shadcn/dialog';
	import Input from '$lib/shadcn/input/input.svelte';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import { useConvexClient } from 'convex-svelte';
	import { toast } from 'svelte-sonner';

	let {
		group,
		programWorkoutId,
		onDeleteGroup
	}: {
		group: ProgramWorkoutGroup;
		programWorkoutId: Id<'programWorkouts'>;
		onDeleteGroup: (groupId: Id<'performanceGroups'>) => void;
	} = $props();

	const client = useConvexClient();

	const toErrorMessage = (error: unknown, fallback: string) => {
		if (error instanceof Error && error.message) {
			return error.message;
		}
		return fallback;
	};

	const updateGroupLabel = async (label: string) => {
		try {
			await client.mutation(api.programWorkoutGroups.update, { id: group._id, label });
		} catch (error) {
			toast.error(toErrorMessage(error, 'Could not update group label.'));
		}
	};

	const addExerciseToGroup = async (exerciseId: Id<'exercises'>) => {
		try {
			await client.mutation(api.programWorkoutExercises.create, {
				programWorkoutId,
				performanceGroupId: group._id,
				exerciseId
			});
		} catch (error) {
			toast.error(toErrorMessage(error, 'Could not add exercise.'));
		}
	};

	const updateExercise = async (
		exerciseTargetId: Id<'performances'>,
		updates: GroupExerciseUpdate
	) => {
		try {
			await client.mutation(api.programWorkoutExercises.update, {
				id: exerciseTargetId,
				...updates
			});
		} catch (error) {
			toast.error(toErrorMessage(error, 'Could not update exercise.'));
		}
	};

	const removeExercise = async (exerciseTargetId: Id<'performances'>) => {
		try {
			await client.mutation(api.programWorkoutExercises.remove, { id: exerciseTargetId });
		} catch (error) {
			toast.error(toErrorMessage(error, 'Could not delete exercise.'));
		}
	};

	let exerciseCount = $derived(group.exercises.length);
	let autoGroupType = $derived.by(() => {
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
	let placeholderText = $derived(autoGroupType ? `${autoGroupType} name (optional)` : 'Group name');
	let displayBadge = $derived(group.label || autoGroupType);
</script>

<article class="border-border/40 bg-card/20 rounded-lg border">
	<div class="border-border/25 flex items-center gap-2 border-b px-3 py-2.5">
		{#if displayBadge && exerciseCount > 1}
			<Badge variant="secondary" class="shrink-0 text-[10px]">
				{displayBadge}
			</Badge>
		{/if}
		<input
			type="text"
			class="placeholder:text-muted-foreground/50 min-w-0 flex-1 bg-transparent text-xs font-medium outline-none"
			placeholder={placeholderText}
			value={group.label ?? ''}
			onchange={(e) => updateGroupLabel(e.currentTarget.value)}
		/>
		<button
			type="button"
			class="text-muted-foreground/50 hover:text-destructive shrink-0 transition-colors"
			onclick={() => onDeleteGroup(group._id)}
		>
			<TrashIcon class="size-3.5" />
		</button>
	</div>

	<div class="px-3 py-3">
		{#if group.exercises.length}
			<div class="space-y-4">
				{#each group.exercises as exerciseTarget, exerciseIndex (exerciseTarget._id)}
					<div class="space-y-2">
						<div class="flex items-start gap-2">
							<div class="min-w-0 flex-1 space-y-1.5">
								<ExerciseSelection
									onExerciseAdded={(exerciseId) =>
										updateExercise(exerciseTarget._id, { exerciseId })}
								>
									{#snippet trigger()}
										<Dialog.Trigger
											class={buttonVariants({
												variant: 'outline',
												size: 'sm',
												class: 'h-8 w-full justify-start text-xs'
											})}
										>
											{exerciseTarget.exercise?.name ?? 'Select exercise'}
										</Dialog.Trigger>
									{/snippet}
								</ExerciseSelection>
								<Input
									class="h-8 text-xs"
									placeholder="Exercise note"
									value={exerciseTarget.note ?? ''}
									onchange={(e) =>
										updateExercise(exerciseTarget._id, {
											note: e.currentTarget.value
										})}
								/>
							</div>
							<button
								type="button"
								class="text-muted-foreground/40 hover:text-destructive mt-1 shrink-0 transition-colors"
								onclick={() => removeExercise(exerciseTarget._id)}
							>
								<TrashIcon class="size-3.5" />
							</button>
						</div>

						<ProgramTemplateExerciseSetsEditor
							exerciseTargetId={exerciseTarget._id}
							executionType={exerciseTarget.exercise?.executionType ?? 'reps'}
							exactSets={exerciseTarget.exactSets}
						/>
					</div>
					{#if exerciseIndex < group.exercises.length - 1}
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
