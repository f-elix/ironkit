<script lang="ts">
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import ProgramTemplateHeaderCard from '$lib/components/training-log/program-template/ProgramTemplateHeaderCard.svelte';
	import ProgramTemplateWeekPlanner from '$lib/components/training-log/program-template/ProgramTemplateWeekPlanner.svelte';
	import ProgramTemplateWorkoutDetails from '$lib/components/training-log/program-template/ProgramTemplateWorkoutDetails.svelte';
	import { setProgramTemplateEditorContext } from '$lib/components/training-log/program-template/program-template-editor.context.svelte.js';
	import * as Sheet from '$lib/shadcn/sheet';
	import { useQuery } from 'convex-svelte';

	let { templateId }: { templateId: Id<'programTemplates'> } = $props();

	const editorState = setProgramTemplateEditorContext();

	const templateQuery = useQuery(api.programTemplates.getById, () => ({ id: templateId }));
	let template = $derived(templateQuery.data);
</script>

{#if templateQuery.isLoading && !template}
	<div class="flex flex-col gap-5 p-4 md:p-0">
		<div class="bg-card/50 h-12 animate-pulse rounded-xl"></div>
		<div class="space-y-3">
			{#each { length: 3 } as _, i (i)}
				<div class="space-y-2">
					<div class="bg-muted/30 h-4 w-16 animate-pulse rounded"></div>
					<div class="flex gap-2">
						<div class="bg-card/30 h-[4.5rem] w-32 animate-pulse rounded-lg"></div>
						<div class="bg-card/30 h-[4.5rem] w-32 animate-pulse rounded-lg"></div>
					</div>
				</div>
			{/each}
		</div>
	</div>
{:else if !template}
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
		<ProgramTemplateHeaderCard {template} />
		<ProgramTemplateWeekPlanner
			templateId={template._id}
			templateTotalWeeks={template.totalWeeks}
		/>
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
			<ProgramTemplateWorkoutDetails templateId={template._id} />
		</Sheet.Content>
	</Sheet.Root>
{/if}
