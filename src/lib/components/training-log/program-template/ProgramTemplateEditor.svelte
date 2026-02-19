<script lang="ts">
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import ProgramTemplateHeaderCard from '$lib/components/training-log/program-template/ProgramTemplateHeaderCard.svelte';
	import ProgramTemplateWeekPlanner from '$lib/components/training-log/program-template/ProgramTemplateWeekPlanner.svelte';
	import ProgramTemplateWorkoutDetails from '$lib/components/training-log/program-template/ProgramTemplateWorkoutDetails.svelte';
	import { setProgramTemplateEditorContext } from '$lib/components/training-log/program-template/program-template-editor.context';
	import { useQuery } from 'convex-svelte';
	import { writable } from 'svelte/store';

	let { templateId }: { templateId: Id<'programTemplates'> } = $props();

	const selectedWorkoutIdStore = writable<Id<'programWorkouts'> | undefined>(undefined);
	setProgramTemplateEditorContext({ selectedWorkoutIdStore });

	const templateQuery = useQuery(api.programTemplates.getById, () => ({ id: templateId }));
	let template = $derived(templateQuery.data);
</script>

{#if templateQuery.isLoading && !template}
	<div class="flex min-h-full flex-col gap-4 p-4 md:p-0">
		<div class="bg-card h-48 animate-pulse rounded-2xl border"></div>
		<div class="grid gap-4 xl:grid-cols-[minmax(19rem,24rem)_1fr]">
			<div class="bg-card h-[28rem] animate-pulse rounded-2xl border"></div>
			<div class="bg-card h-[28rem] animate-pulse rounded-2xl border"></div>
		</div>
	</div>
{:else if !template}
	<div class="flex min-h-full items-center justify-center p-4 md:p-0">
		<div class="bg-card w-full max-w-lg rounded-2xl border p-8 text-center shadow-sm">
			<h1 class="text-xl font-semibold">Template not found</h1>
			<p class="text-muted-foreground mt-2 text-sm">
				This template may have been removed or is no longer accessible.
			</p>
		</div>
	</div>
{:else}
	<div class="flex min-h-full flex-col gap-4 p-4 md:p-0">
		<ProgramTemplateHeaderCard {template} />
		<div class="grid gap-4 xl:grid-cols-[minmax(19rem,24rem)_1fr]">
			<ProgramTemplateWeekPlanner templateId={template._id} templateTotalWeeks={template.totalWeeks} />
			<ProgramTemplateWorkoutDetails templateId={template._id} />
		</div>
	</div>
{/if}
