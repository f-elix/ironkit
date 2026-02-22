<script lang="ts">
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import ProgramTemplateAddWorkoutPopover from '$lib/components/training-log/program-template/ProgramTemplateAddWorkoutPopover.svelte';
	import ProgramTemplateWorkoutCardSummary from '$lib/components/training-log/program-template/ProgramTemplateWorkoutCardSummary.svelte';
	import { getProgramTemplateEditorContext } from '$lib/components/training-log/program-template/program-template-editor.context.svelte.js';
	import type {
		CreateWorkoutMode,
		WorkoutSummaryWithGroups,
		WorkoutWeek
	} from '$lib/components/training-log/program-template/program-template-editor.types';
	import {
		getFirstAvailableTrackKey,
		getTrackColor,
		normalizeTrackKey
	} from '$lib/components/training-log/program-template/program-template-track.utils';
	import SortableWorkoutCard from '$lib/components/training-log/program-template/SortableWorkoutCard.svelte';
	import { DragDropProvider, type DragDropEvents } from '@dnd-kit-svelte/svelte';
	import { move } from '@dnd-kit/helpers';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { toast } from 'svelte-sonner';

	const editorState = getProgramTemplateEditorContext();
	const client = useConvexClient();
	const templateQuery = useQuery(api.programTemplates.getById, () => ({
		id: editorState.templateId
	}));

	const workoutsQuery = useQuery(api.programWorkouts.listByTemplateWithSummaries, () => ({
		programTemplateId: editorState.templateId
	}));

	let templateTotalWeeks = $derived(templateQuery.data?.totalWeeks ?? 1);
	let workouts = $derived((workoutsQuery.data ?? []) as WorkoutSummaryWithGroups[]);
	let selectedWorkoutId = $derived(editorState.selectedWorkoutId);

	let maxWeekNumber = $derived(
		Math.max(templateTotalWeeks, ...workouts.map((w) => w.weekNumber), 1)
	);

	let workoutsByWeek = $derived.by(() => {
		const weeks: WorkoutWeek[] = [];
		for (let week = 1; week <= maxWeekNumber; week++) {
			weeks.push({
				weekNumber: week,
				items: workouts
					.filter((w) => w.weekNumber === week)
					.slice()
					.toSorted((a, b) => a.slotOrder - b.slotOrder)
			});
		}
		return weeks;
	});

	const getNextTrack = (weekNumber: number): string => {
		const weekWorkouts = workouts.filter((w) => w.weekNumber === weekNumber);
		const usedTracks = new Set(weekWorkouts.map((w) => w.trackKey.toUpperCase()));
		return getFirstAvailableTrackKey(usedTracks);
	};

	const canCopyPrior = (weekNumber: number, trackKey: string) => {
		const normalized = normalizeTrackKey(trackKey);
		return workouts.some(
			(workout) =>
				normalizeTrackKey(workout.trackKey) === normalized && workout.weekNumber < weekNumber
		);
	};
	let isCreating = $state(false);

	let dragSnapshot = $state<WorkoutSummaryWithGroups[] | null>(null);

	const makeDragStart =
		(weekNumber: number): DragDropEvents['dragstart'] =>
		() => {
			const weekItems = workouts
				.filter((w) => w.weekNumber === weekNumber)
				.slice()
				.toSorted((a, b) => a.slotOrder - b.slotOrder);
			dragSnapshot = $state.snapshot(weekItems);
		};

	const makeDragEnd =
		(weekNumber: number): DragDropEvents['dragend'] =>
		async (event) => {
			if (!dragSnapshot) {
				return;
			}

			const reordered = move(
				dragSnapshot.map((item) => ({ ...item, id: item._id })),
				event as unknown as Parameters<typeof move>[1]
			);

			dragSnapshot = null;

			try {
				await client.mutation(api.programWorkouts.reorderWithinWeek, {
					programTemplateId: editorState.templateId,
					weekNumber,
					updates: reordered.map((w, i) => ({ id: w._id, slotOrder: i }))
				});
			} catch (error) {
				toast.error(error instanceof Error ? error.message : 'Could not reorder workouts.');
			}
		};

	const createWorkout = async ({
		mode,
		weekNumber,
		trackKey,
		label
	}: {
		mode: CreateWorkoutMode;
		weekNumber: number;
		trackKey: string;
		label: string;
	}) => {
		if (isCreating) {
			return false;
		}
		isCreating = true;

		try {
			const args = {
				programTemplateId: editorState.templateId,
				trackKey: normalizeTrackKey(trackKey),
				label: label.trim() || undefined,
				notes: undefined
			};

			const workoutId =
				mode === 'copy'
					? await client.mutation(api.programWorkouts.copyPreviousTrackOccurrenceToWeek, {
							...args,
							targetWeekNumber: weekNumber
						})
					: await client.mutation(api.programWorkouts.createWeekWorkoutFromScratch, {
							...args,
							weekNumber
						});

			editorState.selectWorkout(workoutId);
			return true;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Could not add workout.');
			return false;
		} finally {
			isCreating = false;
		}
	};

	const selectWorkout = (id: Id<'programWorkouts'>) => {
		editorState.selectWorkout(id);
	};
</script>

<div class="space-y-5 sm:space-y-6">
	{#each workoutsByWeek as week (week.weekNumber)}
		<section>
			<div class="mb-2.5 flex items-center gap-3 sm:mb-3">
				<span
					class="bg-primary/10 text-primary flex h-6 items-center rounded px-2 text-[11px] font-bold tracking-widest uppercase tabular-nums sm:h-7 sm:px-2.5 sm:text-xs"
				>
					Week {week.weekNumber}
				</span>
				{#if week.items.length > 0}
					<span class="text-muted-foreground/70 text-sm tabular-nums">
						{week.items.length}
					</span>
				{/if}
				<div class="bg-border/20 h-px flex-1"></div>
			</div>

			<div class="touch:scrollbar-none -mx-4 flex overflow-x-auto">
				<div class="flex grow gap-2 px-4 sm:gap-3">
					{#if week.items.length > 1}
						<DragDropProvider
							onDragStart={makeDragStart(week.weekNumber)}
							onDragEnd={makeDragEnd(week.weekNumber)}
						>
							<ol class="flex min-w-0 shrink-0 gap-2 sm:gap-3">
								{#each week.items as workout, index (workout._id)}
									<SortableWorkoutCard
										workoutId={workout._id}
										trackKey={workout.trackKey}
										label={workout.label}
										groups={workout.groups ?? []}
										{index}
										isSelected={selectedWorkoutId === workout._id}
										trackColorClass={getTrackColor(workout.trackKey)}
										onSelect={selectWorkout}
									/>
								{/each}
							</ol>
						</DragDropProvider>
					{:else}
						{#each week.items as workout (workout._id)}
							<button
								type="button"
								class={[
									'flex max-w-80 min-w-64 shrink-0 flex-col gap-2 rounded-lg border p-2.5 text-left transition-all duration-150 sm:max-w-96 sm:min-w-72 sm:gap-2.5 sm:p-3',
									selectedWorkoutId === workout._id
										? 'border-primary/50 bg-primary/5 shadow-primary/5 shadow-sm'
										: 'border-border/40 bg-card/25 hover:border-border/70 hover:bg-card/50'
								]}
								onclick={() => selectWorkout(workout._id)}
							>
								<div class="flex flex-col gap-1.5 sm:gap-2">
									<span
										class={[
											'inline-flex w-fit rounded border px-1.5 py-px text-[10px] font-bold tracking-wider uppercase sm:px-2 sm:py-0.5 sm:text-[11px]',
											getTrackColor(workout.trackKey)
										]}
									>
										{workout.trackKey}
									</span>
									<span class="truncate text-sm leading-snug font-medium sm:text-[15px]">
										{workout.label || 'Untitled'}
									</span>
								</div>
								<ProgramTemplateWorkoutCardSummary groups={workout.groups ?? []} />
							</button>
						{/each}
					{/if}

					<div class="shrink-0">
						<ProgramTemplateAddWorkoutPopover
							weekNumber={week.weekNumber}
							defaultTrackKey={getNextTrack(week.weekNumber)}
							{isCreating}
							canCopyPrior={(trackKey) => canCopyPrior(week.weekNumber, trackKey)}
							onCreate={createWorkout}
						/>
					</div>

					{#if !week.items.length}
						<p class="text-muted-foreground/30 flex shrink-0 items-center text-xs">No workouts</p>
					{/if}
				</div>
			</div>
		</section>
	{/each}
</div>
