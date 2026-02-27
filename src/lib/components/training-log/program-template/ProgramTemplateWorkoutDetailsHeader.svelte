<script lang="ts">
	import XIcon from '@lucide/svelte/icons/x';
	import { getProgramTemplateEditorContext } from '$lib/components/training-log/program-template/program-template-editor.context.svelte.js';
	import { getTrackColor } from '$lib/components/training-log/program-template/program-template-track.utils';
	import { CoState } from 'jazz-tools/svelte';
	import { ProgramTemplate } from '$lib/jazz/schema';

	const editorState = getProgramTemplateEditorContext();

	const templateState = new CoState(ProgramTemplate, () => editorState.templateId, {
		resolve: { programWorkouts: { $each: true } }
	});

	const template = $derived(templateState.current.$isLoaded ? templateState.current : undefined);
	const workouts = $derived(template?.programWorkouts ?? []);
	const selectedWorkout = $derived(
		workouts.find((w) => w.$jazz.id === editorState.selectedWorkoutId)
	);

	const trackKey = $derived(selectedWorkout?.trackKey ?? 'A');
	const weekNumber = $derived(selectedWorkout?.weekNumber ?? 1);
	const label = $derived(selectedWorkout?.label ?? '');
	const trackColorClass = $derived(getTrackColor(trackKey));
</script>

{#if selectedWorkout}
	<div
		class="border-border/40 bg-background/95 sticky top-0 z-10 border-b px-6 pt-6 pb-4 backdrop-blur-sm"
	>
		<div class="flex items-center gap-2">
			<span
				class={[
					'rounded border px-1.5 py-px text-[10px] font-bold tracking-wider uppercase',
					trackColorClass
				]}
			>
				{trackKey}
			</span>
			<span class="text-muted-foreground text-xs tabular-nums">Week {weekNumber}</span>
			<button
				type="button"
				class="text-muted-foreground hover:text-foreground ml-auto rounded-sm transition-opacity"
				onclick={editorState.clearSelection}
			>
				<XIcon class="size-5" />
				<span class="sr-only">Close</span>
			</button>
		</div>
		<h2 class="mt-1 text-lg leading-snug font-semibold">
			{label || 'Untitled workout'}
		</h2>
	</div>
{/if}
