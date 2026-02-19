<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { api } from '$convex/_generated/api';
	import type { Doc } from '$convex/_generated/dataModel';
	import DeleteProgramTemplateDialog from '$lib/components/training-log/programs/DeleteProgramTemplateDialog.svelte';
	import ProgramsCreatePanel from '$lib/components/training-log/programs/ProgramsCreatePanel.svelte';
	import ProgramTemplatesList from '$lib/components/training-log/programs/ProgramTemplatesList.svelte';
	import { useConvexClient, useQuery } from 'convex-svelte';

	const templatesQuery = useQuery(api.programTemplates.list, {});
	const client = useConvexClient();

	const dateFormatter = new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium' });

	let templates = $derived(templatesQuery.data ?? []);
	let activeTemplatesCount = $derived(
		templates.filter((template) => template.status !== 'archived').length
	);
	let archivedTemplatesCount = $derived(
		templates.filter((template) => template.status === 'archived').length
	);

	let isCreating = $state(false);
	let createError = $state('');

	let templateToDelete = $state<Doc<'programTemplates'> | null>(null);
	let deleteDialogOpen = $state(false);
	let isDeleting = $state(false);
	let deleteError = $state('');

	const formatDate = (timestamp: number) => dateFormatter.format(new Date(timestamp));

	const createTemplate = async (event: SubmitEvent) => {
		event.preventDefault();
		if (isCreating) {
			return;
		}
		isCreating = true;
		createError = '';
		try {
			const newTemplateId = await client.mutation(api.programTemplates.create, {
				name: 'Untitled program',
				totalWeeks: 4,
				status: 'draft'
			});
			goto(resolve('/(app)/tools/training-log/program-template-[id]', { id: newTemplateId }));
		} catch (error) {
			createError = error instanceof Error ? error.message : 'Could not create template.';
		} finally {
			isCreating = false;
		}
	};

	const askDeleteTemplate = (template: Doc<'programTemplates'>) => {
		deleteError = '';
		templateToDelete = template;
		deleteDialogOpen = true;
	};

	const deleteTemplate = async () => {
		if (!templateToDelete || isDeleting) {
			return;
		}
		isDeleting = true;
		deleteError = '';
		const templateId = templateToDelete._id;
		try {
			await client.mutation(
				api.programTemplates.remove,
				{ id: templateId },
				{
					optimisticUpdate: (localStore) => {
						localStore.setQuery(
							api.programTemplates.list,
							{},
							(localStore.getQuery(api.programTemplates.list, {}) ?? []).filter(
								(template) => template._id !== templateId
							)
						);
					}
				}
			);
			deleteDialogOpen = false;
			templateToDelete = null;
		} catch (error) {
			deleteError = error instanceof Error ? error.message : 'Could not delete template.';
		} finally {
			isDeleting = false;
		}
	};
</script>

<div class="flex grow flex-col p-4 md:p-0">
	<div class="flex grow flex-col gap-4 pb-4 md:grid md:grid-cols-[minmax(16rem,24rem)_1fr]">
		<ProgramsCreatePanel
			{activeTemplatesCount}
			{archivedTemplatesCount}
			{isCreating}
			{createError}
			onCreate={createTemplate}
		/>
		<ProgramTemplatesList
			{templates}
			isLoading={templatesQuery.isLoading}
			{formatDate}
			onDelete={askDeleteTemplate}
		/>
	</div>
</div>

<DeleteProgramTemplateDialog
	bind:open={deleteDialogOpen}
	template={templateToDelete}
	{isDeleting}
	{deleteError}
	onConfirmDelete={deleteTemplate}
/>
