<script lang="ts">
	import DeleteWorkoutDialog from '$lib/components/training-log/DeleteWorkoutDialog.svelte';
	import ProgramTemplateExerciseGroupsSection from '$lib/components/training-log/program-template/ProgramTemplateExerciseGroupsSection.svelte';
	import ProgramTemplateWorkoutDetailsHeader from '$lib/components/training-log/program-template/ProgramTemplateWorkoutDetailsHeader.svelte';
	import ProgramTemplateWorkoutMetaForm from '$lib/components/training-log/program-template/ProgramTemplateWorkoutMetaForm.svelte';
	import ProgramTemplateWorkoutReorderControls from '$lib/components/training-log/program-template/ProgramTemplateWorkoutReorderControls.svelte';
	import { getProgramTemplateEditorContext } from '$lib/components/training-log/program-template/program-template-editor.context.svelte.js';
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

	const selectedWorkoutId = $derived(editorState.selectedWorkoutId);

	const selectedWorkout = $derived(workouts.find((w) => w.$jazz.id === selectedWorkoutId));

	const weekWorkouts = $derived.by(() => {
		if (!selectedWorkout) {
			return [];
		}
		return workouts
			.filter((workout) => workout.weekNumber === selectedWorkout.weekNumber)
			.toSorted((a, b) => a.slotOrder - b.slotOrder);
	});

	const confirmDeleteWorkout = () => {
		if (!template || !selectedWorkoutId) {
			return;
		}
		template.programWorkouts.$jazz.remove((workout) => workout.$jazz.id === selectedWorkoutId);
		template.$jazz.set('updatedAt', new Date());
		editorState.clearSelection();
	};
</script>

<div class="flex min-h-full flex-col">
	{#if selectedWorkout}
		<ProgramTemplateWorkoutDetailsHeader />

		<div class="flex-1 space-y-6 px-6 py-5">
			<ProgramTemplateWorkoutMetaForm />

			<ProgramTemplateExerciseGroupsSection />

			<ProgramTemplateWorkoutReorderControls {template} {weekWorkouts} />

			<div class="border-border/20 border-t pt-4">
				<DeleteWorkoutDialog onConfirmDelete={confirmDeleteWorkout} />
			</div>
		</div>
	{:else if selectedWorkoutId && !template?.$isLoaded}
		<div class="flex flex-1 items-center justify-center px-6 py-12">
			<p class="text-muted-foreground text-sm">Loading workout...</p>
		</div>
	{:else if selectedWorkoutId}
		<div class="flex flex-1 items-center justify-center px-6 py-12">
			<p class="text-muted-foreground text-sm">Workout not found.</p>
		</div>
	{/if}
</div>
