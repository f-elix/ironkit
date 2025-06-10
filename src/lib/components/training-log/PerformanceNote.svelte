<script lang="ts">
	import { Textarea } from '$lib/shadcn/textarea';
	import { triplit } from '$lib/db/triplit';
	import Label from '$lib/shadcn/label/label.svelte';

	import type { Performance } from '$lib/db/types';

	let { performance }: { performance: Performance } = $props();

	const onNoteChange = (event: Event) => {
		const note = (event.target as HTMLTextAreaElement).value;
		triplit.update('performances', performance.id, { note });
	};
</script>

<Label class="flex flex-col gap-2">
	<span class="sr-only">Note</span>
	<Textarea
		value={performance.note}
		oninput={onNoteChange}
		placeholder="Note"
		class="p-2 text-sm leading-4 font-normal"
	/>
</Label>
