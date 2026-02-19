<script lang="ts">
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import DeleteWorkoutDialog from '$lib/components/training-log/DeleteWorkoutDialog.svelte';
	import { getProgramTemplateEditorContext } from '$lib/components/training-log/program-template/program-template-editor.context';
	import type {
		CreateWorkoutMode,
		WorkoutSummary,
		WorkoutWeek
	} from '$lib/components/training-log/program-template/program-template-editor.types';
	import Badge from '$lib/shadcn/badge/badge.svelte';
	import Button from '$lib/shadcn/button/button.svelte';
	import Input from '$lib/shadcn/input/input.svelte';
	import Label from '$lib/shadcn/label/label.svelte';
	import { Textarea } from '$lib/shadcn/textarea';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { toast } from 'svelte-sonner';

	let {
		templateId,
		templateTotalWeeks
	}: {
		templateId: Id<'programTemplates'>;
		templateTotalWeeks: number;
	} = $props();

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

	let createMode = $state<CreateWorkoutMode>('scratch');
	let createWeekNumber = $state(1);
	let createTrackKey = $state('A');
	let createLabel = $state('');
	let createNotes = $state('');

	let isCreatingWorkout = $state(false);
	let isDeletingWorkout = $state(false);
	let deleteDialogOpen = $state(false);
	let pendingDeleteWorkoutId = $state<Id<'programWorkouts'> | undefined>(undefined);

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

	const setCreateWeek = (value: number) => {
		if (!Number.isFinite(value)) {
			createWeekNumber = 1;
			if (createMode === 'copy') {
				createMode = 'scratch';
			}
			return;
		}
		const normalizedWeek = normalizePositiveInt(value, 1);
		createWeekNumber = Math.min(normalizedWeek, Math.max(1, templateTotalWeeks));
		if (
			createMode === 'copy' &&
			!workouts.some(
				(workout) =>
					workout.trackKey === (createTrackKey.trim().toUpperCase() || 'A') &&
					workout.weekNumber < createWeekNumber
			)
		) {
			createMode = 'scratch';
		}
	};

	const setCreateTrack = (value: string) => {
		createTrackKey = value;
		if (
			createMode === 'copy' &&
			!workouts.some(
				(workout) =>
					workout.trackKey === (value.trim().toUpperCase() || 'A') &&
					workout.weekNumber < createWeekNumber
			)
		) {
			createMode = 'scratch';
		}
	};

	let maxWeekNumber = $derived.by(() => {
		let maxWeek = Math.max(1, templateTotalWeeks);
		for (const workout of workouts) {
			if (workout.weekNumber > maxWeek) {
				maxWeek = workout.weekNumber;
			}
		}
		return maxWeek;
	});

	let workoutsByWeek = $derived.by(() => {
		const weeks: WorkoutWeek[] = [];
		for (let week = 1; week <= maxWeekNumber; week += 1) {
			weeks.push({
				weekNumber: week,
				items: workouts
					.filter((workout) => workout.weekNumber === week)
					.slice()
					.sort((a, b) => a.slotOrder - b.slotOrder)
			});
		}
		return weeks;
	});

	let normalizedCreateTrackKey = $derived(createTrackKey.trim().toUpperCase() || 'A');
	let normalizedCreateWeek = $derived(
		Math.min(normalizePositiveInt(createWeekNumber, 1), Math.max(1, templateTotalWeeks))
	);
	let hasPriorWorkoutForCreateSelection = $derived.by(() => {
		return workouts.some(
			(workout) =>
				workout.trackKey === normalizedCreateTrackKey && workout.weekNumber < normalizedCreateWeek
		);
	});
	let canUseCopyPrior = $derived(hasPriorWorkoutForCreateSelection);

	const createWorkout = async () => {
		if (isCreatingWorkout) {
			return;
		}
		isCreatingWorkout = true;
		try {
			const normalizedTrackKey = normalizedCreateTrackKey;
			const normalizedWeek = normalizedCreateWeek;
			const args = {
				programTemplateId: templateId,
				trackKey: normalizedTrackKey,
				label: createLabel.trim() || undefined,
				notes: createNotes.trim() || undefined
			};

			if (createMode === 'copy' && !canUseCopyPrior) {
				toast.error('No prior workout found for this track before the selected week.');
				return;
			}

			const workoutId =
				createMode === 'copy'
					? await client.mutation(api.programWorkouts.copyPreviousTrackOccurrenceToWeek, {
							...args,
							targetWeekNumber: normalizedWeek
						})
					: await client.mutation(api.programWorkouts.createWeekWorkoutFromScratch, {
							...args,
							weekNumber: normalizedWeek
						});

			selectedWorkoutIdStore.set(workoutId);
			createWeekNumber = normalizedWeek;
			createLabel = '';
			createNotes = '';
		} catch (error) {
			toast.error(toErrorMessage(error, 'Could not add workout.'));
		} finally {
			isCreatingWorkout = false;
		}
	};

	const requestDeleteWorkout = (workoutId: Id<'programWorkouts'>) => {
		pendingDeleteWorkoutId = workoutId;
		deleteDialogOpen = true;
	};

	const confirmDeleteWorkout = async () => {
		if (!pendingDeleteWorkoutId || isDeletingWorkout) {
			return;
		}
		isDeletingWorkout = true;
		try {
			await client.mutation(api.programWorkouts.remove, { id: pendingDeleteWorkoutId });
			if (preferredSelectedWorkoutId === pendingDeleteWorkoutId) {
				selectedWorkoutIdStore.set(undefined);
			}
			pendingDeleteWorkoutId = undefined;
		} catch (error) {
			toast.error(toErrorMessage(error, 'Could not delete workout.'));
		} finally {
			isDeletingWorkout = false;
		}
	};

	const moveWorkoutWithinWeek = async (workoutId: Id<'programWorkouts'>, direction: -1 | 1) => {
		const current = workouts.find((workout) => workout._id === workoutId);
		if (!current) {
			return;
		}
		const weekWorkouts = workouts
			.filter((workout) => workout.weekNumber === current.weekNumber)
			.slice()
			.sort((a, b) => a.slotOrder - b.slotOrder);
		const currentIndex = weekWorkouts.findIndex((workout) => workout._id === workoutId);
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
				weekNumber: current.weekNumber,
				updates: reordered.map((workout, index) => ({
					id: workout._id,
					slotOrder: index
				}))
			});
		} catch (error) {
			toast.error(toErrorMessage(error, 'Could not reorder workouts.'));
		}
	};

	const selectWorkout = (workoutId: Id<'programWorkouts'>) => {
		selectedWorkoutIdStore.set(workoutId);
	};
</script>

<section class="bg-card/90 flex flex-col gap-4 rounded-2xl border p-4 shadow-sm">
	<div class="space-y-1">
		<h2 class="text-lg font-semibold">Week planner</h2>
		<p class="text-muted-foreground text-sm">
			Create and arrange workouts per week. Select one to edit details.
		</p>
	</div>

	<div class="rounded-xl border p-3">
		<div class="grid gap-2">
			<div class="grid grid-cols-2 gap-2">
				<Label class="grid gap-1">
					<span class="text-xs">Week</span>
					<Input
						type="number"
						min="1"
						value={createWeekNumber}
						oninput={(event) => {
							setCreateWeek(event.currentTarget.valueAsNumber);
						}}
					/>
				</Label>
				<Label class="grid gap-1">
					<span class="text-xs">Track</span>
					<Input
						maxlength={8}
						value={createTrackKey}
						oninput={(event) => {
							setCreateTrack(event.currentTarget.value);
						}}
					/>
				</Label>
			</div>
			<Label class="grid gap-1">
				<span class="text-xs">Label</span>
				<Input
					placeholder="Lower body strength"
					value={createLabel}
					oninput={(event) => {
						createLabel = event.currentTarget.value;
					}}
				/>
			</Label>
			<Label class="grid gap-1">
				<span class="text-xs">Notes</span>
				<Textarea
					rows={2}
					value={createNotes}
					oninput={(event) => {
						createNotes = event.currentTarget.value;
					}}
				/>
			</Label>
			<div class="grid grid-cols-2 gap-2">
				<Button
					variant={createMode === 'scratch' ? 'default' : 'outline'}
					onclick={() => {
						createMode = 'scratch';
					}}
				>
					<PlusIcon class="size-4" />
					Blank
				</Button>
				<Button
					variant={createMode === 'copy' ? 'default' : 'outline'}
					onclick={() => {
						if (!canUseCopyPrior) {
							return;
						}
						createMode = 'copy';
					}}
					disabled={!canUseCopyPrior}
				>
					<CopyIcon class="size-4" />
					Copy prior
				</Button>
			</div>
			<Button onclick={createWorkout} disabled={isCreatingWorkout}>
				{isCreatingWorkout ? 'Adding...' : 'Add workout'}
			</Button>
		</div>
	</div>

	<div class="space-y-3">
		{#each workoutsByWeek as week (week.weekNumber)}
			<article class="rounded-xl border p-3">
				<div class="mb-2 flex items-center justify-between">
					<h3 class="text-sm font-semibold">Week {week.weekNumber}</h3>
					<Badge variant="outline">{week.items.length}</Badge>
				</div>

				{#if week.items.length}
					<ul class="space-y-2">
						{#each week.items as workout, index (workout._id)}
							<li
								class={[
									'rounded-lg border p-2 transition-colors',
									selectedWorkoutId === workout._id
										? 'border-primary bg-primary/5'
										: 'hover:border-primary/50'
								]}
							>
								<div class="flex gap-2">
									<button
										type="button"
										class="min-w-0 grow text-left"
										onclick={() => {
											selectWorkout(workout._id);
										}}
									>
										<p class="text-muted-foreground text-xs font-medium uppercase">
											{workout.trackKey}
										</p>
										<p class="truncate text-sm font-medium">
											{workout.label || 'Untitled workout'}
										</p>
										<p class="text-muted-foreground truncate text-xs">
											Slot {workout.slotOrder + 1}
										</p>
									</button>
									<div class="flex shrink-0 items-start gap-1">
										<Button
											variant="ghost"
											size="icon"
											class="size-7"
											onclick={() => moveWorkoutWithinWeek(workout._id, -1)}
											disabled={index === 0}
										>
											<ArrowUpIcon class="size-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											class="size-7"
											onclick={() => moveWorkoutWithinWeek(workout._id, 1)}
											disabled={index === week.items.length - 1}
										>
											<ArrowDownIcon class="size-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											class="text-destructive hover:text-destructive size-7"
											onclick={() => requestDeleteWorkout(workout._id)}
										>
											<TrashIcon class="size-4" />
										</Button>
									</div>
								</div>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="text-muted-foreground text-xs">No workouts yet.</p>
				{/if}
			</article>
		{/each}
	</div>
</section>

<DeleteWorkoutDialog
	bind:open={deleteDialogOpen}
	title="Delete template workout"
	description="Are you sure you want to delete this workout from the template? This action cannot be undone."
	confirmLabel="Delete workout"
	isDeleting={isDeletingWorkout}
	onConfirmDelete={confirmDeleteWorkout}
/>
