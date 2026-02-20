<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Doc } from '$convex/_generated/dataModel';
	import Badge from '$lib/shadcn/badge/badge.svelte';
	import { buttonVariants } from '$lib/shadcn/button';
	import * as DropdownMenu from '$lib/shadcn/dropdown-menu';
	import { cn } from '$lib/shadcn/utils';
	import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
	import TrashIcon from '@lucide/svelte/icons/trash-2';

	let {
		template,
		updatedAtLabel,
		onDelete,
		animationDelay = 0
	}: {
		template: Doc<'programTemplates'>;
		updatedAtLabel: string;
		onDelete: () => void;
		animationDelay?: number;
	} = $props();

	const href = $derived(
		resolve('/(app)/tools/training-log/program-template-[id]', { id: template._id })
	);
</script>

<li
	class={[
		'group relative overflow-hidden rounded-xl border transition-all duration-200',
		'bg-card hover:border-primary/25 hover:shadow-primary/5 hover:shadow-md',
		'animate-in fade-in slide-in-from-bottom-1 duration-300 [animation-fill-mode:both]'
	]}
	style:animation-delay="{animationDelay}ms"
>
	<a {href} class="block p-4 pr-12">
		<div class="flex items-center gap-2.5">
			<h3 class="min-w-0 truncate text-base font-semibold">{template.name}</h3>
			<Badge
				variant={template.status === 'archived' ? 'secondary' : 'default'}
				class="shrink-0 text-[11px] tracking-wider uppercase"
			>
				{template.status}
			</Badge>
		</div>
		<div class="text-muted-foreground mt-1.5 flex items-center gap-2 text-xs">
			<span class="tabular-nums">{template.totalWeeks} weeks</span>
			<span class="opacity-30">&middot;</span>
			<span>Updated {updatedAtLabel}</span>
		</div>
		{#if template.notes}
			<p class="text-muted-foreground/70 mt-2.5 line-clamp-2 text-sm leading-relaxed">
				{template.notes}
			</p>
		{/if}
	</a>

	<div class="absolute top-2.5 right-2">
		<DropdownMenu.Root>
			<DropdownMenu.Trigger
				class={cn(
					buttonVariants({ variant: 'ghost', size: 'icon' }),
					'text-muted-foreground size-8',
					'pointer:opacity-0 pointer:group-hover:opacity-100 pointer:focus-visible:opacity-100',
					'transition-opacity'
				)}
				aria-label={`Actions for ${template.name}`}
			>
				<EllipsisVerticalIcon class="size-4" />
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end">
				<DropdownMenu.Item variant="destructive" onSelect={onDelete}>
					<TrashIcon />
					Delete
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
</li>
