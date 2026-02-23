<script lang="ts">
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import { buttonVariants } from '$lib/shadcn/button';
	import * as Popover from '$lib/shadcn/popover';
	import { Textarea } from '$lib/shadcn/textarea';
	import StickyNoteIcon from '@lucide/svelte/icons/sticky-note';
	import { useConvexClient } from 'convex-svelte';
	import { toast } from 'svelte-sonner';

	let {
		performanceId,
		note
	}: {
		performanceId: Id<'performances'>;
		note?: string;
	} = $props();

	const client = useConvexClient();

	let displayNote = $derived(note?.trim() ?? '');

	const save = async (value: string) => {
		const nextNote = value.trim();
		if (nextNote === note?.trim()) {
			return;
		}

		try {
			await client.mutation(api.performances.update, {
				id: performanceId,
				note: nextNote
			});
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Could not save note.');
		}
	};
</script>

<div class="flex items-center gap-2">
	<Popover.Root>
		<Popover.Trigger
			class={buttonVariants({
				variant: 'secondary',
				size: 'icon'
			})}
		>
			<StickyNoteIcon class="size-4" />
		</Popover.Trigger>
		<Popover.Content class="w-72" align="start">
			<div class="grid gap-2">
				<Textarea
					rows={3}
					placeholder="Add note..."
					value={note}
					onblur={(e) => {
						void save(e.currentTarget.value);
					}}
					class="text-sm"
				/>
				<Popover.Close class={buttonVariants({ variant: 'secondary', size: 'sm' })}>
					Save
				</Popover.Close>
			</div>
		</Popover.Content>
	</Popover.Root>
	{#if displayNote}
		<p class="text-muted-foreground w-56 text-xs">{displayNote}</p>
	{/if}
</div>
