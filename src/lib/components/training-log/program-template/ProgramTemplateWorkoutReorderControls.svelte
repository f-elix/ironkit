<script lang="ts">
	import Button from '$lib/shadcn/button/button.svelte';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { getProgramTemplateEditorContext } from '$lib/components/training-log/program-template/program-template-editor.context.svelte.js';
	import type { ResolvedProgramTemplate, ProgramWorkout } from '$lib/jazz/types';

	let {
		template,
		weekWorkouts
	}: {
		template: ResolvedProgramTemplate | undefined;
		weekWorkouts: ProgramWorkout[];
	} = $props();

	const editorState = getProgramTemplateEditorContext();

	const selectedWorkoutId = $derived(editorState.selectedWorkoutId);

	const positionInWeek = $derived(
		selectedWorkoutId
			? weekWorkouts.findIndex((workout) => workout.$jazz.id === selectedWorkoutId)
			: -1
	);
	const total = $derived(weekWorkouts.length);

	const moveWithinWeek = (direction: -1 | 1) => {
		if (!selectedWorkoutId || !template) {
			return;
		}
		const currentIndex = positionInWeek;
		const nextIndex = currentIndex + direction;
		if (currentIndex < 0 || nextIndex < 0 || nextIndex >= weekWorkouts.length) {
			return;
		}
		const movedId = weekWorkouts[currentIndex].$jazz.id;
		weekWorkouts
			.toSorted((a, b) => a.slotOrder - b.slotOrder)
			.forEach((workout) => {
				if (workout.slotOrder === nextIndex) {
					workout.$jazz.set('slotOrder', currentIndex);
				}
				if (workout.$jazz.id === movedId) {
					workout.$jazz.set('slotOrder', nextIndex);
				}
			});
	};
</script>

{#if weekWorkouts.length > 1 && positionInWeek >= 0}
	<div
		class="border-border/25 bg-muted/10 flex items-center justify-between rounded-lg border px-3 py-2"
	>
		<span class="text-muted-foreground text-xs tabular-nums">
			Position {positionInWeek + 1} of {total} in week
		</span>
		<div class="flex gap-1">
			<Button
				variant="ghost"
				size="icon"
				class="size-6"
				disabled={positionInWeek === 0}
				onclick={() => moveWithinWeek(-1)}
			>
				<ChevronLeftIcon class="size-3.5" />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				class="size-6"
				disabled={positionInWeek === total - 1}
				onclick={() => moveWithinWeek(1)}
			>
				<ChevronRightIcon class="size-3.5" />
			</Button>
		</div>
	</div>
{/if}
