<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import ProgramTemplateListItem from '$lib/components/training-log/programs/ProgramTemplateListItem.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { Button } from '$lib/shadcn/button';
	import {
		PROGRAM_TEMPLATE_FILTER_OPTIONS,
		type ProgramTemplateFilter
	} from '$lib/training-log/program-template-status';
	import ClipboardListIcon from '@lucide/svelte/icons/clipboard-list';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { Account } from '$lib/jazz/schema';
	import { AccountCoState } from 'jazz-tools/svelte';
	import { ProgramTemplate } from '$lib/jazz/schema';

	const account = new AccountCoState(Account, {
		resolve: {
			root: {
				programTemplates: {
					$each: {
						programWorkouts: { $each: true }
					}
				},
				programRuns: {
					$each: {
						programTemplate: true
					}
				}
			}
		}
	});

	const root = $derived(account.current.$isLoaded ? account.current.root : null);

	const activeRun = $derived.by(() => {
		if (!root) {
			return null;
		}

		return (
			root.programRuns
				.filter((run) => run.status === 'active' || run.status === 'paused')
				.toSorted((a, b) => b.startedAt.getTime() - a.startedAt.getTime())[0] ?? null
		);
	});

	const dateFormatter = new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium' });
	const formatDate = (date: Date | number) => dateFormatter.format(new Date(date));

	let filter = $state<ProgramTemplateFilter>('all');

	let templates = $derived(root?.programTemplates ?? []);
	let filterCounts = $derived.by(() => ({
		all: templates.length,
		draft: templates.filter((t) => t.status === 'draft').length,
		published: templates.filter((t) => t.status === 'published').length,
		archived: templates.filter((t) => t.status === 'archived').length
	}));
	let filteredTemplates = $derived(
		filter === 'all' ? templates : templates.filter((t) => t.status === filter)
	);

	const createTemplate = () => {
		if (!root) {
			return;
		}
		const newTemplate = ProgramTemplate.create({
			name: 'Untitled program',
			totalWeeks: 4,
			status: 'draft',
			programWorkouts: [],
			updatedAt: new Date()
		});
		root.programTemplates.$jazz.push(newTemplate);
		goto(resolve('/(app)/tools/training-log/program-template-[id]', { id: newTemplate.$jazz.id }));
	};
</script>

<div class="flex grow flex-col p-4 md:p-0">
	<div class="mx-auto w-full max-w-2xl space-y-6 py-2">
		<header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<h1 class="text-2xl font-bold tracking-tight">Programs</h1>
				<p class="text-muted-foreground mt-1 text-sm">Create and manage your training templates.</p>
			</div>
			<Button onclick={createTemplate} class="shrink-0">
				<PlusIcon />
				New program
			</Button>
		</header>

		{#if templates.length > 0}
			<nav class="flex gap-1" aria-label="Filter templates">
				{#each PROGRAM_TEMPLATE_FILTER_OPTIONS as { key, label } (key)}
					{@const count = filterCounts[key]}
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

		{#if !root}
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
				{#each filteredTemplates as template, i (template.$jazz.id)}
					{@const isActiveTemplate = activeRun?.programTemplate.$jazz.id === template.$jazz.id}
					<ProgramTemplateListItem
						{template}
						updatedAtLabel={formatDate(template.updatedAt)}
						workoutCount={template.programWorkouts.length}
						activeRunId={isActiveTemplate ? activeRun.$jazz.id : undefined}
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
					<Button onclick={createTemplate}>
						<PlusIcon />
						New program
					</Button>
				{/snippet}
			</EmptyState>
		{/if}
	</div>
</div>
