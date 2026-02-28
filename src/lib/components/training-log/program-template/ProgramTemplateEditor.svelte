<script lang="ts">
	import ProgramTemplateHeaderCard from '$lib/components/training-log/program-template/ProgramTemplateHeaderCard.svelte';
	import ProgramTemplateWeekPlanner from '$lib/components/training-log/program-template/ProgramTemplateWeekPlanner.svelte';
	import ProgramTemplateWorkoutDetails from '$lib/components/training-log/program-template/ProgramTemplateWorkoutDetails.svelte';
	import { setProgramTemplateEditorContext } from '$lib/components/training-log/program-template/program-template-editor.context.svelte.js';
	import * as Sheet from '$lib/shadcn/sheet';
	import { CoState } from 'jazz-tools/svelte';
	import { ProgramTemplate } from '$lib/jazz/schema';

	let { templateId }: { templateId: string } = $props();

	const editorState = setProgramTemplateEditorContext(() => templateId);

	const templateState = new CoState(ProgramTemplate, () => templateId, {
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
</script>

{#if !template?.$isLoaded}
	<div class="flex min-h-[60vh] items-center justify-center">
		<div class="text-center">
			<h1 class="text-lg font-semibold">Template not found</h1>
			<p class="text-muted-foreground mt-1.5 text-sm">
				This program template may have been removed.
			</p>
		</div>
	</div>
{:else}
	<div class="flex flex-col gap-5 p-4 md:p-0">
		<ProgramTemplateHeaderCard />
		<ProgramTemplateWeekPlanner />
	</div>
	<Sheet.Root open={editorState.sheetOpen} onOpenChange={editorState.setSheetOpen}>
		<Sheet.Content
			side="right"
			class="w-full overflow-y-auto p-0 sm:max-w-xl [&>button[class*='absolute']]:hidden"
		>
			<div class="sr-only">
				<Sheet.Title>Edit workout</Sheet.Title>
				<Sheet.Description>Edit workout details, exercises and sets</Sheet.Description>
			</div>
			<ProgramTemplateWorkoutDetails />
		</Sheet.Content>
	</Sheet.Root>
{/if}
