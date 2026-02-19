<script lang="ts">
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import ExerciseSelection from '$lib/components/training-log/ExerciseSelection.svelte';
	import ProgramTemplateExerciseSetsEditor from '$lib/components/training-log/program-template/ProgramTemplateExerciseSetsEditor.svelte';
	import { getProgramTemplateEditorContext } from '$lib/components/training-log/program-template/program-template-editor.context';
	import type {
		GroupExerciseUpdate,
		ProgramWorkoutDetails,
		ProgramWorkoutDraft,
		WorkoutSummary,
		WorkoutMetaUpdate
	} from '$lib/components/training-log/program-template/program-template-editor.types';
	import Button, { buttonVariants } from '$lib/shadcn/button/button.svelte';
	import * as Dialog from '$lib/shadcn/dialog';
	import Input from '$lib/shadcn/input/input.svelte';
	import Label from '$lib/shadcn/label/label.svelte';
	import { Textarea } from '$lib/shadcn/textarea';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { onDestroy } from 'svelte';
	import { toast } from 'svelte-sonner';

	let { templateId }: { templateId: Id<'programTemplates'> } = $props();

	const { selectedWorkoutIdStore } = getProgramTemplateEditorContext();
	const client = useConvexClient();

	const workoutsQuery = useQuery(api.programWorkouts.listByTemplate, () => ({
		programTemplateId: templateId
	}));

	let workouts = $derived((workoutsQuery.data ?? []) as WorkoutSummary[]);
	let preferredSelectedWorkoutId = $derived($selectedWorkoutIdStore);
	let selectedWorkoutId = $derived.by(() => {
		if (!workouts.length) {
			return undefined;
		}
		if (
			preferredSelectedWorkoutId &&
			workouts.some((workout) => workout._id === preferredSelectedWorkoutId)
		) {
			return preferredSelectedWorkoutId;
		}
		return workouts[0]?._id;
	});
	const selectedWorkoutQuery = useQuery(api.programWorkouts.getById, () => ({
		id: selectedWorkoutId
	}));
	let selectedWorkout = $derived(selectedWorkoutQuery.data as ProgramWorkoutDetails | null | undefined);

	let workoutDraftById = $state<Record<string, ProgramWorkoutDraft>>({});
	let saveMetaTimer: ReturnType<typeof setTimeout> | undefined;

	let selectedWorkoutDraft = $derived(
		selectedWorkout && selectedWorkoutId ? (workoutDraftById[selectedWorkoutId] ?? {}) : {}
	);
	let workoutWeekNumber = $derived(selectedWorkoutDraft.weekNumber ?? selectedWorkout?.weekNumber ?? 1);
	let workoutTrackKey = $derived(selectedWorkoutDraft.trackKey ?? selectedWorkout?.trackKey ?? 'A');
	let workoutLabel = $derived(selectedWorkoutDraft.label ?? selectedWorkout?.label ?? '');
	let workoutNotes = $derived(selectedWorkoutDraft.notes ?? selectedWorkout?.notes ?? '');

	const normalizePositiveInt = (value: number, fallback = 1) => {
		if (!Number.isFinite(value)) {
			return fallback;
		}
		return Math.max(1, Math.floor(value));
	};

	const toErrorMessage = (error: unknown, fallback: string) => {
		if (error instanceof Error && error.message) {
			return error.message;
		}
		return fallback;
	};

	const updateSelectedWorkoutDraft = (update: WorkoutMetaUpdate) => {
		if (!selectedWorkoutId || !selectedWorkout || selectedWorkout._id !== selectedWorkoutId) {
			return;
		}
		const existing = workoutDraftById[selectedWorkoutId] ?? {};
		const nextDraft = {
			...existing,
			[update.field]: update.value
		};
		workoutDraftById = {
			...workoutDraftById,
			[selectedWorkoutId]: nextDraft
		};
		queueWorkoutMetaSave(selectedWorkoutId, selectedWorkout, nextDraft);
	};

	const buildWorkoutMetaPayload = (workout: ProgramWorkoutDetails, draft: ProgramWorkoutDraft) => {
		return {
			weekNumber: normalizePositiveInt(draft.weekNumber ?? workout.weekNumber, 1),
			trackKey: (draft.trackKey ?? workout.trackKey).trim().toUpperCase() || 'A',
			label: (draft.label ?? workout.label ?? '').trim(),
			notes: (draft.notes ?? workout.notes ?? '').trim()
		};
	};

	const saveWorkoutMeta = async (
		workoutId: Id<'programWorkouts'>,
		payload: ReturnType<typeof buildWorkoutMetaPayload>
	) => {
		try {
			await client.mutation(api.programWorkouts.updateWorkoutMeta, {
				id: workoutId,
				...payload
			});
			workoutDraftById = {
				...workoutDraftById,
				[workoutId]: payload
			};
		} catch (error) {
			toast.error(toErrorMessage(error, 'Could not save workout details.'));
		}
	};

	const queueWorkoutMetaSave = (
		workoutId: Id<'programWorkouts'>,
		workout: ProgramWorkoutDetails,
		draft: ProgramWorkoutDraft
	) => {
		if (saveMetaTimer) {
			clearTimeout(saveMetaTimer);
		}
		const payload = buildWorkoutMetaPayload(workout, draft);
		saveMetaTimer = setTimeout(() => {
			void saveWorkoutMeta(workoutId, payload);
		}, 350);
	};

	onDestroy(() => {
		if (saveMetaTimer) {
			clearTimeout(saveMetaTimer);
		}
	});

	const addGroup = async () => {
		if (!selectedWorkout) {
			return;
		}
		try {
			await client.mutation(api.programWorkoutGroups.create, {
				programWorkoutId: selectedWorkout._id,
				workoutOrder: selectedWorkout.groups.length
			});
		} catch (error) {
			toast.error(toErrorMessage(error, 'Could not add group.'));
		}
	};

	const updateGroupLabel = async (groupId: Id<'performanceGroups'>, label: string) => {
		try {
			await client.mutation(api.programWorkoutGroups.update, {
				id: groupId,
				label
			});
		} catch (error) {
			toast.error(toErrorMessage(error, 'Could not update group label.'));
		}
	};

	const removeGroup = async (groupId: Id<'performanceGroups'>) => {
		if (!confirm('Delete this group and all exercises in it?')) {
			return;
		}
		try {
			await client.mutation(api.programWorkoutGroups.remove, {
				id: groupId
			});
		} catch (error) {
			toast.error(toErrorMessage(error, 'Could not delete group.'));
		}
	};

	const addExerciseToGroup = async (groupId: Id<'performanceGroups'>, exerciseId: Id<'exercises'>) => {
		if (!selectedWorkout) {
			return;
		}
		try {
			await client.mutation(api.programWorkoutExercises.create, {
				programWorkoutId: selectedWorkout._id,
				performanceGroupId: groupId,
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
			await client.mutation(api.programWorkoutExercises.remove, {
				id: exerciseTargetId
			});
		} catch (error) {
			toast.error(toErrorMessage(error, 'Could not delete exercise.'));
		}
	};

	const updateSetTarget = async (
		setId: Id<'performanceSets'>,
		executionType: 'reps' | 'time',
		value: number
	) => {
		const normalizedValue = normalizePositiveInt(value, executionType === 'reps' ? 8 : 60);
		try {
			await client.mutation(api.programWorkoutExerciseSets.update, {
				id: setId,
				targetReps: executionType === 'reps' ? normalizedValue : undefined,
				targetDurationSeconds: executionType === 'time' ? normalizedValue : undefined
			});
		} catch (error) {
			toast.error(toErrorMessage(error, 'Could not update set target.'));
		}
	};
</script>

<section class="bg-card/90 rounded-2xl border p-4 shadow-sm">
	{#if selectedWorkout}
		<div class="space-y-4">
			<div class="flex flex-wrap items-start justify-between gap-3">
				<div class="space-y-1">
					<h2 class="text-xl font-semibold">Workout details</h2>
					<p class="text-muted-foreground text-sm">
						Edit week, ordering, and exercise targets for this workout.
					</p>
				</div>
			</div>

			<div class="grid gap-3 rounded-xl border p-3 md:grid-cols-2 xl:grid-cols-4">
				<Label class="grid gap-1.5">
					<span class="text-xs">Week</span>
					<Input
						type="number"
						min="1"
						value={workoutWeekNumber}
						oninput={(event) => {
							updateSelectedWorkoutDraft({
								field: 'weekNumber',
								value: event.currentTarget.valueAsNumber
							});
						}}
					/>
				</Label>
				<Label class="grid gap-1.5">
					<span class="text-xs">Track</span>
					<Input
						maxlength={8}
						value={workoutTrackKey}
						oninput={(event) => {
							updateSelectedWorkoutDraft({
								field: 'trackKey',
								value: event.currentTarget.value
							});
						}}
					/>
				</Label>
				<Label class="grid gap-1.5">
					<span class="text-xs">Label</span>
					<Input
						value={workoutLabel}
						oninput={(event) => {
							updateSelectedWorkoutDraft({
								field: 'label',
								value: event.currentTarget.value
							});
						}}
					/>
				</Label>
				<Label class="grid gap-1.5 md:col-span-2 xl:col-span-4">
					<span class="text-xs">Workout notes</span>
					<Textarea
						rows={2}
						value={workoutNotes}
						oninput={(event) => {
							updateSelectedWorkoutDraft({
								field: 'notes',
								value: event.currentTarget.value
							});
						}}
					/>
				</Label>
			</div>

			<div class="space-y-3">
				<div class="flex items-center justify-between gap-2">
					<h3 class="text-base font-semibold">Exercise groups</h3>
					<Button variant="outline" size="sm" onclick={addGroup}>
						<PlusIcon class="size-4" />
						Add group
					</Button>
				</div>

				{#if selectedWorkout.groups.length}
					<div class="space-y-3">
						{#each selectedWorkout.groups as group (group._id)}
							<article class="rounded-xl border p-3">
								<div class="mb-3 flex flex-wrap items-end gap-2">
									<Label class="grid min-w-[16rem] grow gap-1.5">
										<span class="text-xs">Group label</span>
										<Input
											value={group.label ?? ''}
											onchange={(event) => updateGroupLabel(group._id, event.currentTarget.value)}
										/>
									</Label>
									<Button
										variant="ghost"
										size="sm"
										class="text-destructive hover:text-destructive"
										onclick={() => removeGroup(group._id)}
									>
										<TrashIcon class="size-4" />
										Delete group
									</Button>
								</div>

								{#if group.exercises.length}
									<ul class="space-y-3">
										{#each group.exercises as exerciseTarget (exerciseTarget._id)}
											<li class="bg-muted/30 rounded-lg border p-3">
												<div class="mb-3 grid gap-2 lg:grid-cols-[minmax(0,14rem)_1fr_auto]">
													<Label class="grid gap-1">
														<span class="text-xs">Exercise</span>
														<ExerciseSelection
															onExerciseAdded={(exerciseId) =>
																updateExercise(exerciseTarget._id, {
																	exerciseId
																})}
														>
															{#snippet trigger()}
																<Dialog.Trigger
																	class={buttonVariants({
																		variant: 'outline',
																		class: 'w-full justify-start'
																	})}
																>
																	{exerciseTarget.exercise?.name ?? 'Select exercise'}
																</Dialog.Trigger>
															{/snippet}
														</ExerciseSelection>
													</Label>
													<Label class="grid gap-1">
														<span class="text-xs">Note</span>
														<Input
															value={exerciseTarget.note ?? ''}
															onchange={(event) =>
																updateExercise(exerciseTarget._id, {
																	note: event.currentTarget.value
																})}
														/>
													</Label>
													<Button
														variant="ghost"
														size="sm"
														class="text-destructive hover:text-destructive self-end"
														onclick={() => removeExercise(exerciseTarget._id)}
													>
														<TrashIcon class="size-4" />
														Delete
													</Button>
												</div>

												<ProgramTemplateExerciseSetsEditor
													exerciseTargetId={exerciseTarget._id}
													executionType={exerciseTarget.exercise?.executionType ?? 'reps'}
													exactSets={exerciseTarget.exactSets}
													onUpdate={updateSetTarget}
												/>
											</li>
										{/each}
									</ul>
								{:else}
									<p class="text-muted-foreground text-sm">No exercises in this group yet.</p>
								{/if}

								<ExerciseSelection onExerciseAdded={(exerciseId) => addExerciseToGroup(group._id, exerciseId)}>
									{#snippet trigger()}
										<Dialog.Trigger class={buttonVariants({ variant: 'secondary', class: 'mt-3 w-full' })}>
											<PlusIcon class="size-4" />
											Add exercise
										</Dialog.Trigger>
									{/snippet}
								</ExerciseSelection>
							</article>
						{/each}
					</div>
				{:else}
					<div class="rounded-xl border border-dashed p-6 text-center">
						<p class="text-muted-foreground text-sm">No groups yet. Add one to start planning sets.</p>
					</div>
				{/if}
			</div>
		</div>
	{:else}
		<div class="flex h-full min-h-[30rem] items-center justify-center rounded-xl border border-dashed">
			<p class="text-muted-foreground text-sm">Select or create a workout to edit details.</p>
		</div>
	{/if}
</section>
