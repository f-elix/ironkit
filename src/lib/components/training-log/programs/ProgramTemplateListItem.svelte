<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Doc } from '$convex/_generated/dataModel';
	import Badge from '$lib/shadcn/badge/badge.svelte';
	import { Button } from '$lib/shadcn/button';
	import TrashIcon from '@lucide/svelte/icons/trash-2';

	let {
		template,
		updatedAtLabel,
		onDelete
	}: {
		template: Doc<'programTemplates'>;
		updatedAtLabel: string;
		onDelete: (template: Doc<'programTemplates'>) => void;
	} = $props();

	const href = $derived(
		resolve('/(app)/tools/training-log/program-template-[id]', { id: template._id })
	);
</script>

<li class="group bg-card/90 relative overflow-hidden rounded-xl border shadow-sm">
	<div
		class="bg-primary/40 group-hover:bg-primary absolute inset-y-0 left-0 w-1 transition-colors"
	></div>
	<div class="flex items-start gap-2 p-4">
		<a {href} class="min-w-0 grow space-y-2">
			<div class="flex items-start justify-between gap-3">
				<h3 class="truncate pr-2 text-base leading-6 font-semibold">{template.name}</h3>
			</div>
			<p class="text-muted-foreground line-clamp-2 text-sm leading-5">
				{template.notes || 'No notes yet.'}
			</p>
			<div class="flex flex-wrap items-center gap-2 pt-1 text-xs">
				<Badge variant={template.status === 'archived' ? 'secondary' : 'default'}>
					{template.status}
				</Badge>
				<Badge variant="outline">{template.totalWeeks} weeks</Badge>
				<span class="text-muted-foreground">Updated {updatedAtLabel}</span>
			</div>
		</a>
		<Button
			variant="ghost"
			size="icon"
			class="text-muted-foreground hover:text-destructive mt-1 shrink-0"
			aria-label={`Delete ${template.name}`}
			onclick={() => onDelete(template)}
		>
			<TrashIcon />
		</Button>
	</div>
</li>
