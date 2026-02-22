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
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { onDestroy } from 'svelte';
	import { toast } from 'svelte-sonner';

	const editorState = getProgramTemplateEditorContext();
	const client = useConvexClient();

	const workoutsQuery = useQuery(api.programWorkouts.listByTemplate, () => ({
		programTemplateId: editorState.templateId
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
		].toSorted();
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
			available.toSorted();
		}

		const nextTrack = getNextAvailableTrack(currentWeek) ?? getFirstAvailableTrackKey(takenInWeek);
		if (!available.includes(nextTrack)) {
			available.push(nextTrack);
			available.toSorted();
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
		if (!(error instanceof Error) || !error.message) {
			return fallback;
		}

		const rawMessage = error.message.trim();
		if (
			rawMessage.includes(
				'Cannot delete a program workout referenced by unfinished run sessions'
			) ||
			rawMessage.includes(
				'Cannot delete this workout because it is referenced by an unfinished run session.'
			)
		) {
			return 'This workout is used by an unfinished run session. Finish or remove those sessions first.';
		}

		const normalized = rawMessage
			.split('\n')[0]
			.replace(/^\[CONVEX [^\]]+\]\s*/, '')
			.replace(/^Uncaught (?:Error|ConvexError):\s*/, '')
			.replace(/^\[Request ID:[^\]]+\]\s*/, '')
			.trim();

		if (!normalized || normalized === 'Server Error') {
			return fallback;
		}

		return normalized || fallback;
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

	let weekWorkouts = $derived.by(() => {
		if (!selectedWorkout) {
			return [];
		}
		return workouts
			.filter((workout) => workout.weekNumber === selectedWorkout.weekNumber)
			.slice()
			.toSorted((a, b) => a.slotOrder - b.slotOrder);
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
				programTemplateId: editorState.templateId,
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
				programWorkoutId={selectedWorkout._id}
				groups={selectedWorkout.groups}
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
