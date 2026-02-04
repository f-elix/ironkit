<script lang="ts">
	import { Textarea } from '$lib/shadcn/textarea';
	import Label from '$lib/shadcn/label/label.svelte';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';

	import type { Performance } from '$lib/db/types';

	let { performance }: { performance: Performance } = $props();

	const client = useConvexClient();

	const onNoteChange = (event: Event) => {
		const note = (event.target as HTMLTextAreaElement).value;
		client.mutation(api.performances.update, { id: performance._id, note });
	};
</script>

<Label class="flex flex-col gap-2">
	<span class="sr-only">Note</span>
	<Textarea
		value={performance.note}
		onblur={onNoteChange}
		placeholder="Note"
		class="p-2 text-sm leading-4 font-normal"
	/>
</Label>
