<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { api } from '$convex/_generated/api';
	import ProgramTemplateListItem from '$lib/components/training-log/programs/ProgramTemplateListItem.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { Button } from '$lib/shadcn/button';
	import ClipboardListIcon from '@lucide/svelte/icons/clipboard-list';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { useConvexClient, useQuery } from 'convex-svelte';

	const templatesQuery = useQuery(api.programTemplates.list, {});
	const activeRunQuery = useQuery(api.programRuns.getActiveRun, {});
	const client = useConvexClient();

	const activeRun = $derived(activeRunQuery.data ?? null);

	const dateFormatter = new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium' });
	const formatDate = (timestamp: number) => dateFormatter.format(new Date(timestamp));

	type Filter = 'all' | 'draft' | 'archived';
	const filterOptions: { key: Filter; label: string }[] = [
		{ key: 'all', label: 'All' },
		{ key: 'draft', label: 'Draft' },
		{ key: 'archived', label: 'Archived' }
	];

	let filter = $state<Filter>('all');
	let isCreating = $state(false);
	let createError = $state('');

	let templates = $derived(templatesQuery.data ?? []);
	let draftCount = $derived(templates.filter((t) => t.status === 'draft').length);
	let archivedCount = $derived(templates.filter((t) => t.status === 'archived').length);
	let filteredTemplates = $derived(
		filter === 'all' ? templates : templates.filter((t) => t.status === filter)
	);

	const createTemplate = async () => {
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

</script>

<div class="flex grow flex-col p-4 md:p-0">
	<div class="mx-auto w-full max-w-2xl space-y-6 py-2">
		<header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<h1 class="text-2xl font-bold tracking-tight">Programs</h1>
				<p class="text-muted-foreground mt-1 text-sm">Create and manage your training templates.</p>
			</div>
			<Button onclick={createTemplate} disabled={isCreating} class="shrink-0">
				<PlusIcon />
				{isCreating ? 'Creating...' : 'New program'}
			</Button>
		</header>

		{#if createError}
			<p class="text-destructive text-sm">{createError}</p>
		{/if}

		{#if templates.length > 0}
			<nav class="flex gap-1" aria-label="Filter templates">
				{#each filterOptions as { key, label } (key)}
					{@const count =
						key === 'all' ? templates.length : key === 'draft' ? draftCount : archivedCount}
					<button
						class={[
							'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
							filter === key
								? 'bg-primary text-primary-foreground'
								: 'text-muted-foreground hover:text-foreground hover:bg-muted'
						]}
						aria-pressed={filter === key}
						onclick={() => (filter = key)}
					>
						{label}
						<span class={['ml-0.5 tabular-nums', filter === key ? 'opacity-70' : 'opacity-50']}>
							{count}
						</span>
					</button>
				{/each}
			</nav>
		{/if}

		{#if templatesQuery.isLoading}
			<ul class="grid gap-3">
				{#each Array.from({ length: 3 }) as _, i (`skeleton-${i}`)}
					<li
						class={['bg-card/60 h-24 rounded-xl border', 'animate-pulse']}
						style:animation-delay="{i * 100}ms"
					></li>
				{/each}
			</ul>
		{:else if filteredTemplates.length > 0}
			<ul class="grid gap-3 pb-20 md:pb-0">
				{#each filteredTemplates as template, i (template._id)}
					{@const isActiveTemplate = activeRun?.programTemplateId === template._id}
					<ProgramTemplateListItem
						{template}
						updatedAtLabel={formatDate(template.updatedAt)}
						workoutCount={template.workoutCount}
						activeRunId={isActiveTemplate ? activeRun._id : undefined}
						hasOtherActiveRun={!!activeRun && !isActiveTemplate}
						animationDelay={i * 50}
					/>
				{/each}
			</ul>
		{:else if filter !== 'all' && templates.length > 0}
			<div class="text-muted-foreground py-16 text-center text-sm">
				No {filter} templates.
			</div>
		{:else}
			<EmptyState title="No programs yet">
				{#snippet icon()}
					<ClipboardListIcon class="text-muted-foreground size-12" />
				{/snippet}
				{#snippet description()}
					Create your first program template to start
					<br />
					structuring your training by week.
				{/snippet}
				{#snippet button()}
					<Button onclick={createTemplate} disabled={isCreating}>
						<PlusIcon />
						{isCreating ? 'Creating...' : 'New program'}
					</Button>
				{/snippet}
			</EmptyState>
		{/if}
	</div>
</div>
