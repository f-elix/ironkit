<script lang="ts">
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import DeleteWorkoutDialog from '$lib/components/training-log/DeleteWorkoutDialog.svelte';
	import ProgramTemplateExerciseGroupsSection from '$lib/components/training-log/program-template/ProgramTemplateExerciseGroupsSection.svelte';
	import ProgramTemplateWorkoutDetailsHeader from '$lib/components/training-log/program-template/ProgramTemplateWorkoutDetailsHeader.svelte';
	import ProgramTemplateWorkoutMetaForm from '$lib/components/training-log/program-template/ProgramTemplateWorkoutMetaForm.svelte';
	import ProgramTemplateWorkoutReorderControls from '$lib/components/training-log/program-template/ProgramTemplateWorkoutReorderControls.svelte';
	import { getProgramTemplateEditorContext } from '$lib/components/training-log/program-template/program-template-editor.context.svelte.js';
	import type {
		GroupExerciseUpdate,
		ProgramWorkoutDetails,
		ProgramWorkoutDraft,
		WorkoutMetaUpdate,
		WorkoutSummary
	} from '$lib/components/training-log/program-template/program-template-editor.types';
	import {
		getFirstAvailableTrackKey,
		getTrackColor,
		normalizeTrackKey
	} from '$lib/components/training-log/program-template/program-template-track.utils';
	import Button from '$lib/shadcn/button/button.svelte';
	import * as Dialog from '$lib/shadcn/dialog';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { onDestroy } from 'svelte';
	import { toast } from 'svelte-sonner';

	let { templateId }: { templateId: Id<'programTemplates'> } = $props();

	const editorState = getProgramTemplateEditorContext();
	const client = useConvexClient();

	const workoutsQuery = useQuery(api.programWorkouts.listByTemplate, () => ({
		programTemplateId: templateId
	}));

	let workouts = $derived((workoutsQuery.data ?? []) as WorkoutSummary[]);
	let selectedWorkoutId = $derived(editorState.selectedWorkoutId);

	const selectedWorkoutQuery = useQuery(api.programWorkouts.getById, () =>
		selectedWorkoutId ? { id: selectedWorkoutId } : 'skip'
	);
	let selectedWorkout = $derived(
		selectedWorkoutQuery.data as ProgramWorkoutDetails | null | undefined
	);

	let workoutDraftById = $state<Record<string, ProgramWorkoutDraft>>({});
	let saveMetaTimer: ReturnType<typeof setTimeout> | undefined;

	let selectedWorkoutDraft = $derived(
		selectedWorkout && selectedWorkoutId ? (workoutDraftById[selectedWorkoutId] ?? {}) : {}
	);
	let workoutWeekNumber = $derived(
		selectedWorkoutDraft.weekNumber ?? selectedWorkout?.weekNumber ?? 1
	);
	let workoutTrackKey = $derived(selectedWorkoutDraft.trackKey ?? selectedWorkout?.trackKey ?? 'A');
	let workoutLabel = $derived(selectedWorkoutDraft.label ?? selectedWorkout?.label ?? '');
	let workoutNotes = $derived(selectedWorkoutDraft.notes ?? selectedWorkout?.notes ?? '');

	const getNextAvailableTrack = (weekNumber: number): string | null => {
		const usedInWeek = new Set(
			workouts
				.filter(
					(workout) =>
						workout.weekNumber === weekNumber &&
						selectedWorkoutId &&
						workout._id !== selectedWorkoutId
				)
				.map((workout) => normalizeTrackKey(workout.trackKey))
		);
		const allTracks = new Set(workouts.map((workout) => normalizeTrackKey(workout.trackKey)));

		for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
			if (!usedInWeek.has(letter) && !allTracks.has(letter)) {
				return letter;
			}
		}

		return null;
	};

	let availableTrackKeys = $derived.by(() => {
		const currentWeek = workoutWeekNumber;
		const currentTrackKey = normalizeTrackKey(workoutTrackKey);
		const allTracks = [
			...new Set(workouts.map((workout) => normalizeTrackKey(workout.trackKey)))
		].sort();
		const takenInWeek = new Set(
			workouts
				.filter(
					(workout) =>
						workout.weekNumber === currentWeek &&
						selectedWorkoutId &&
						workout._id !== selectedWorkoutId
				)
				.map((workout) => normalizeTrackKey(workout.trackKey))
		);

		const available = allTracks.filter((track) => !takenInWeek.has(track));
		if (!available.includes(currentTrackKey)) {
			available.push(currentTrackKey);
			available.sort();
		}

		const nextTrack = getNextAvailableTrack(currentWeek) ?? getFirstAvailableTrackKey(takenInWeek);
		if (!available.includes(nextTrack)) {
			available.push(nextTrack);
			available.sort();
		}

		return available;
	});

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
		const nextDraft = { ...existing, [update.field]: update.value };
		workoutDraftById = { ...workoutDraftById, [selectedWorkoutId]: nextDraft };
		queueWorkoutMetaSave(selectedWorkoutId, selectedWorkout, nextDraft);
	};

	const buildWorkoutMetaPayload = (workout: ProgramWorkoutDetails, draft: ProgramWorkoutDraft) => ({
		weekNumber: normalizePositiveInt(draft.weekNumber ?? workout.weekNumber, 1),
		trackKey: normalizeTrackKey(draft.trackKey ?? workout.trackKey),
		label: (draft.label ?? workout.label ?? '').trim(),
		notes: (draft.notes ?? workout.notes ?? '').trim()
	});

	const saveWorkoutMeta = async (
		workoutId: Id<'programWorkouts'>,
		payload: ReturnType<typeof buildWorkoutMetaPayload>
	) => {
		try {
			await client.mutation(api.programWorkouts.updateWorkoutMeta, { id: workoutId, ...payload });
			workoutDraftById = { ...workoutDraftById, [workoutId]: payload };
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
			await client.mutation(api.programWorkoutGroups.update, { id: groupId, label });
		} catch (error) {
			toast.error(toErrorMessage(error, 'Could not update group label.'));
		}
	};

	const removeGroup = async (groupId: Id<'performanceGroups'>) => {
		try {
			await client.mutation(api.programWorkoutGroups.remove, { id: groupId });
		} catch (error) {
			toast.error(toErrorMessage(error, 'Could not delete group.'));
		}
	};

	let groupPendingDelete = $state<Id<'performanceGroups'> | undefined>(undefined);
	let groupDeleteDialogOpen = $state(false);

	const promptDeleteGroup = (groupId: Id<'performanceGroups'>) => {
		groupPendingDelete = groupId;
		groupDeleteDialogOpen = true;
	};

	const confirmRemoveGroup = async () => {
		if (!groupPendingDelete) {
			return;
		}
		await removeGroup(groupPendingDelete);
		groupPendingDelete = undefined;
		groupDeleteDialogOpen = false;
	};

	const addExerciseToGroup = async (
		groupId: Id<'performanceGroups'>,
		exerciseId: Id<'exercises'>
	) => {
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
			await client.mutation(api.programWorkoutExercises.remove, { id: exerciseTargetId });
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

	let weekWorkouts = $derived.by(() => {
		if (!selectedWorkout) {
			return [];
		}
		return workouts
			.filter((workout) => workout.weekNumber === selectedWorkout.weekNumber)
			.slice()
			.sort((a, b) => a.slotOrder - b.slotOrder);
	});
	let positionInWeek = $derived(
		selectedWorkoutId ? weekWorkouts.findIndex((workout) => workout._id === selectedWorkoutId) : -1
	);

	const moveWithinWeek = async (direction: -1 | 1) => {
		if (!selectedWorkoutId || !selectedWorkout) {
			return;
		}
		const currentIndex = positionInWeek;
		const nextIndex = currentIndex + direction;
		if (currentIndex < 0 || nextIndex < 0 || nextIndex >= weekWorkouts.length) {
			return;
		}
		const reordered = weekWorkouts.slice();
		const [moved] = reordered.splice(currentIndex, 1);
		reordered.splice(nextIndex, 0, moved);
		try {
			await client.mutation(api.programWorkouts.reorderWithinWeek, {
				programTemplateId: templateId,
				weekNumber: selectedWorkout.weekNumber,
				updates: reordered.map((workout, index) => ({ id: workout._id, slotOrder: index }))
			});
		} catch (error) {
			toast.error(toErrorMessage(error, 'Could not reorder workouts.'));
		}
	};

	let deleteDialogOpen = $state(false);
	let isDeletingWorkout = $state(false);

	const confirmDeleteWorkout = async () => {
		if (!selectedWorkoutId || isDeletingWorkout) {
			return;
		}
		isDeletingWorkout = true;
		try {
			await client.mutation(api.programWorkouts.remove, { id: selectedWorkoutId });
			editorState.clearSelection();
		} catch (error) {
			toast.error(toErrorMessage(error, 'Could not delete workout.'));
		} finally {
			isDeletingWorkout = false;
			deleteDialogOpen = false;
		}
	};
</script>

<div class="flex min-h-full flex-col">
	{#if selectedWorkout}
		<ProgramTemplateWorkoutDetailsHeader
			trackKey={workoutTrackKey}
			weekNumber={workoutWeekNumber}
			label={workoutLabel}
			trackColorClass={getTrackColor(workoutTrackKey)}
			onClose={editorState.clearSelection}
		/>

		<div class="flex-1 space-y-6 px-6 py-5">
			<ProgramTemplateWorkoutMetaForm
				weekNumber={workoutWeekNumber}
				trackKey={workoutTrackKey}
				label={workoutLabel}
				notes={workoutNotes}
				{availableTrackKeys}
				onUpdate={updateSelectedWorkoutDraft}
			/>

			<ProgramTemplateExerciseGroupsSection
				groups={selectedWorkout.groups}
				onAddGroup={addGroup}
				onUpdateGroupLabel={updateGroupLabel}
				onPromptDeleteGroup={promptDeleteGroup}
				onAddExerciseToGroup={addExerciseToGroup}
				onUpdateExercise={updateExercise}
				onRemoveExercise={removeExercise}
				onUpdateSetTarget={updateSetTarget}
			/>

			{#if weekWorkouts.length > 1 && positionInWeek >= 0}
				<ProgramTemplateWorkoutReorderControls
					position={positionInWeek}
					total={weekWorkouts.length}
					onMove={moveWithinWeek}
				/>
			{/if}

			<div class="border-border/20 border-t pt-4">
				<Button
					variant="ghost"
					size="sm"
					class="text-destructive hover:text-destructive h-7 text-xs"
					onclick={() => {
						deleteDialogOpen = true;
					}}
				>
					<TrashIcon class="size-3.5" />
					Delete workout
				</Button>
			</div>
		</div>
	{:else if selectedWorkoutId && selectedWorkoutQuery.isLoading}
		<div class="flex flex-1 items-center justify-center px-6 py-12">
			<p class="text-muted-foreground text-sm">Loading workout...</p>
		</div>
	{:else if selectedWorkoutId}
		<div class="flex flex-1 items-center justify-center px-6 py-12">
			<p class="text-muted-foreground text-sm">Workout not found.</p>
		</div>
	{/if}
</div>

<DeleteWorkoutDialog
	bind:open={deleteDialogOpen}
	title="Delete template workout"
	description="Remove this workout from the program template? This action cannot be undone."
	confirmLabel="Delete workout"
	isDeleting={isDeletingWorkout}
	onConfirmDelete={confirmDeleteWorkout}
/>

<Dialog.Root bind:open={groupDeleteDialogOpen}>
	<Dialog.Content>
		<Dialog.Title>Delete exercise group</Dialog.Title>
		<Dialog.Description>
			Delete this group and all exercises in it? This cannot be undone.
		</Dialog.Description>
		<Dialog.Footer class="flex flex-row justify-end gap-2">
			<Button variant="secondary" onclick={() => (groupDeleteDialogOpen = false)}>Cancel</Button>
			<Button variant="destructive" onclick={confirmRemoveGroup}>Delete group</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
