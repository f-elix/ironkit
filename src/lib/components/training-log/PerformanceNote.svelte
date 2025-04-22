<script lang="ts">
	import { Textarea } from '$lib/shadcn/textarea';
	import { triplit } from '$lib/db/triplit';
	import Label from '$lib/shadcn/label/label.svelte';
	import { buttonVariants } from '$lib/shadcn/button/button.svelte';
	import Pencil from '@lucide/svelte/icons/pencil';
	import type { Performance } from '$lib/db/types';
	import * as Collapsible from '$lib/shadcn/collapsible';

	let { performance }: { performance: Performance } = $props();

	const onNoteChange = (event: Event) => {
		const note = (event.target as HTMLTextAreaElement).value;
		triplit.update('performances', performance.id, { note });
	};

	let open = $state(!!performance.note);
</script>

<Collapsible.Root bind:open>
	{#if !open}
		<Collapsible.Trigger class={buttonVariants({ variant: 'secondary', size: 'sm' })}>
			<Pencil />
			Add note
		</Collapsible.Trigger>
	{/if}
	<Collapsible.Content>
		<Label class="flex flex-col gap-2">
			<span class="text-sm text-muted-foreground">Note</span>
			<Textarea value={performance.note} oninput={onNoteChange} rows={2} class="min-h-none" />
		</Label>
	</Collapsible.Content>
</Collapsible.Root>
