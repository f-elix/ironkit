<script lang="ts">
	import { createSortable } from '@dnd-kit/svelte/sortable';
	import type { ResolvedProgramWorkout } from '$lib/jazz/workout';
	import ProgramTemplateWorkoutCardSummary from '$lib/components/training-log/program-template/ProgramTemplateWorkoutCardSummary.svelte';
	import { getProgramTemplateEditorContext } from '$lib/components/training-log/program-template/program-template-editor.context.svelte.js';
	import { getTrackColor } from '$lib/components/training-log/program-template/program-template-track.utils';
	import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';

	let {
		workout,
		index
	}: {
		workout: ResolvedProgramWorkout;
		index: number;
	} = $props();

	const editorState = getProgramTemplateEditorContext();
	const workoutId = $derived(workout.$jazz.id);
	const isSelected = $derived(editorState.selectedWorkoutId === workoutId);
	const performanceGroups = $derived(workout.performanceGroups.filter((g) => g.$isLoaded));
	const trackColorClass = $derived(getTrackColor(workout.trackKey));

	const { attach: attachRef, isDragging } = $derived(
		createSortable({
			id: workoutId,
			index
		})
	);
</script>

<li
	class={[
		'w-64 shrink-0 rounded-lg border transition-[backgroud-color,border-color,box-shadow] duration-150 sm:w-72',
		isDragging
			? 'border-primary/50 bg-primary/10 ring-primary/20 z-10 ring-1'
			: isSelected
				? 'border-primary/50 bg-primary/5'
				: 'border-border/40 bg-card/25 hover:border-border/70 hover:bg-card/50'
	]}
	{@attach attachRef}
>
	<button
		type="button"
		onclick={() => editorState.selectWorkout(workoutId)}
		aria-label="Edit workout"
		class="sr-only"
	></button>
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="flex size-full flex-col gap-3 p-2 text-left sm:p-3"
		onclick={() => editorState.selectWorkout(workoutId)}
	>
		<div class="flex items-center gap-2">
			<div
				class="text-muted-foreground/30 flex shrink-0 cursor-grab items-start active:cursor-grabbing"
			>
				<GripVerticalIcon class="size-4" />
			</div>
			<span
				class={[
					'inline-flex w-fit rounded border px-1.5 py-px text-[10px] font-bold tracking-wider uppercase sm:px-2 sm:py-0.5 sm:text-[11px]',
					trackColorClass
				]}
			>
				{workout.trackKey}
			</span>
			<span class="truncate text-sm leading-snug font-medium sm:text-[15px]">
				{workout.label || 'Untitled'}
			</span>
		</div>
		<ProgramTemplateWorkoutCardSummary {performanceGroups} />
	</div>
</li>
