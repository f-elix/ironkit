<script lang="ts">
	import type { Doc } from '$convex/_generated/dataModel';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Badge from '$lib/shadcn/badge/badge.svelte';
	import ClipboardListIcon from '@lucide/svelte/icons/clipboard-list';
	import ProgramTemplateListItem from './ProgramTemplateListItem.svelte';

	let {
		templates,
		isLoading,
		formatDate,
		onDelete
	}: {
		templates: Doc<'programTemplates'>[];
		isLoading: boolean;
		formatDate: (timestamp: number) => string;
		onDelete: (template: Doc<'programTemplates'>) => void;
	} = $props();
</script>

<section class="flex flex-col gap-3">
	<div class="flex items-end justify-between gap-3">
		<div class="space-y-1">
			<h2 class="text-lg leading-6 font-semibold">Program templates</h2>
			<p class="text-muted-foreground text-sm">
				Open a template to manage workouts, exercises, and runs.
			</p>
		</div>
		<Badge variant="outline">{templates.length} total</Badge>
	</div>

	{#if isLoading}
		<ul class="grid gap-3">
			{#each Array.from({ length: 4 }) as _, index (`loading-${index}`)}
				<li class="bg-card/70 h-28 animate-pulse rounded-xl border"></li>
			{/each}
		</ul>
	{:else if templates.length}
		<ul class="grid gap-3 pb-20 md:pb-0">
			{#each templates as template (template._id)}
				<ProgramTemplateListItem
					{template}
					updatedAtLabel={formatDate(template.updatedAt)}
					{onDelete}
				/>
			{/each}
		</ul>
	{:else}
		<EmptyState title="No templates yet">
			{#snippet icon()}
				<ClipboardListIcon class="text-muted-foreground size-12" />
			{/snippet}
			{#snippet description()}
				Create your first program template to start
				<br />
				structuring workouts by week.
			{/snippet}
		</EmptyState>
	{/if}
</section>
