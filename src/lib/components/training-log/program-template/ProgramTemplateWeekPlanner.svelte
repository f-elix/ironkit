<script lang="ts">
	import ProgramTemplateAddWorkoutPopover from '$lib/components/training-log/program-template/ProgramTemplateAddWorkoutPopover.svelte';
	import ProgramTemplateWorkoutCardSummary from '$lib/components/training-log/program-template/ProgramTemplateWorkoutCardSummary.svelte';
	import { getProgramTemplateEditorContext } from '$lib/components/training-log/program-template/program-template-editor.context.svelte.js';
	import {
		getFirstAvailableTrackKey,
		getTrackColor,
		normalizeTrackKey
	} from '$lib/components/training-log/program-template/program-template-track.utils';
	import SortableWorkoutCard from '$lib/components/training-log/program-template/SortableWorkoutCard.svelte';
	import { RestrictToHorizontalAxis } from '@dnd-kit/abstract/modifiers';
	import { DragDropProvider } from '@dnd-kit/svelte';
	import { move } from '@dnd-kit/helpers';
	import type { ComponentProps } from 'svelte';
	import { CoState } from 'jazz-tools/svelte';
	import { ProgramTemplate } from '$lib/jazz/schema';

	const editorState = getProgramTemplateEditorContext();

	const templateState = new CoState(ProgramTemplate, () => editorState.templateId, {
		resolve: {
			programWorkouts: {
				$each: {
					performanceGroups: {
						$each: {
							performances: {
								$each: {
									exercise: true,
									performanceSets: { $each: true }
								}
							}
						}
					}
				}
			}
		}
	});

	const template = $derived(templateState.current.$isLoaded ? templateState.current : undefined);
	const workouts = $derived(template?.programWorkouts ?? []);

	const templateTotalWeeks = $derived(template?.totalWeeks ?? 1);
	const maxWeekNumber = $derived(
		Math.max(templateTotalWeeks, ...workouts.map((w) => w.weekNumber), 1)
	);

	const workoutsByWeek = $derived.by(() => {
		return Array.from({ length: maxWeekNumber }, (_, index) => {
			const weekNumber = index + 1;
			return {
				weekNumber,
				items: workouts
					.filter((w) => w.weekNumber === weekNumber)
					.toSorted((a, b) => a.slotOrder - b.slotOrder)
			};
		});
	});

	let selectedWorkoutId = $derived(editorState.selectedWorkoutId);

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

	const makeDragEnd =
		(weekNumber: number): ComponentProps<typeof DragDropProvider>['onDragEnd'] =>
		(event) => {
			if (!template) {
				return;
			}

			const weekWorkouts = workoutsByWeek.find((w) => w.weekNumber === weekNumber)?.items;
			if (!weekWorkouts) {
				return;
			}

			const reordered = move(
				weekWorkouts.map((item) => ({ ...item, id: item.$jazz.id })),
				event
			);

			// Update slotOrder for each workout in the reordered list
			reordered.forEach((item, index) => {
				const workout = weekWorkouts.find((w) => w.$jazz.id === item.id);
				if (!workout) {
					return;
				}
				workout.$jazz.set('slotOrder', index);
			});
		};

	const selectWorkout = (id: string) => {
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
				<div class="flex grow gap-2 px-4 pb-4 sm:gap-3">
					{#if week.items.length > 1}
						<DragDropProvider
							onDragEnd={makeDragEnd(week.weekNumber)}
							modifiers={[RestrictToHorizontalAxis]}
						>
							<ol class="flex min-w-0 shrink-0 gap-2 sm:gap-3">
								{#each week.items as workout, index (workout.$jazz.id)}
									<SortableWorkoutCard {workout} {index} />
								{/each}
							</ol>
						</DragDropProvider>
					{:else}
						{#each week.items as workout (workout.$jazz.id)}
							{@const performanceGroups = workout.performanceGroups}
							<button
								type="button"
								class={[
									'flex max-w-80 min-w-64 shrink-0 flex-col gap-2 rounded-lg border p-2.5 text-left transition-all duration-150 sm:max-w-96 sm:min-w-72 sm:gap-2.5 sm:p-3',
									selectedWorkoutId === workout.$jazz.id
										? 'border-primary/50 bg-primary/5 shadow-primary/5 shadow-sm'
										: 'border-border/40 bg-card/25 hover:border-border/70 hover:bg-card/50'
								]}
								onclick={() => selectWorkout(workout.$jazz.id)}
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
								<ProgramTemplateWorkoutCardSummary
									performanceGroups={performanceGroups.filter((g) => g.$isLoaded)}
								/>
							</button>
						{/each}
					{/if}

					<div class="shrink-0">
						<ProgramTemplateAddWorkoutPopover
							weekNumber={week.weekNumber}
							defaultTrackKey={getNextTrack(week.weekNumber)}
							canCopyPrior={(trackKey) => canCopyPrior(week.weekNumber, trackKey)}
							{template}
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
