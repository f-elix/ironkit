<script lang="ts">
	import { buttonVariants } from '$lib/shadcn/button';
	import * as Popover from '$lib/shadcn/popover';
	import { Textarea } from '$lib/shadcn/textarea';
	import StickyNoteIcon from '@lucide/svelte/icons/sticky-note';
	import type { Performance } from '$lib/jazz/types';

	let {
		note,
		performance
	}: {
		note?: string;
		performance: Performance;
	} = $props();

	const displayNote = $derived(note?.trim() ?? '');
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
					bind:value={
						() => note ?? '',
						(v) => {
							performance.$jazz.set('note', v);
						}
					}
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
