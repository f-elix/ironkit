<script lang="ts">
	import { Button } from '$lib/shadcn/button';
	import PlusIcon from '@lucide/svelte/icons/plus';

	let {
		activeTemplatesCount,
		archivedTemplatesCount,
		isCreating,
		createError,
		onCreate
	}: {
		activeTemplatesCount: number;
		archivedTemplatesCount: number;
		isCreating: boolean;
		createError: string;
		onCreate: (event: SubmitEvent) => void;
	} = $props();
</script>

<section
	class="bg-card/85 flex flex-col gap-4 self-start rounded-2xl border p-4 shadow-sm backdrop-blur"
>
	<div class="space-y-1">
		<h2 class="text-lg leading-6 font-semibold">Create template</h2>
		<p class="text-muted-foreground text-sm">
			Start a blank template and configure it on the next page.
		</p>
	</div>

	<form class="flex flex-col gap-3" onsubmit={onCreate}>
		{#if createError}
			<p class="text-destructive text-sm">{createError}</p>
		{/if}

		<Button type="submit" class="mt-1" disabled={isCreating}>
			<PlusIcon />
			{isCreating ? 'Creating...' : 'Create blank template'}
		</Button>
	</form>

	<div class="grid grid-cols-2 gap-2 pt-2 text-sm">
		<div class="bg-muted/65 rounded-xl border p-3">
			<p class="text-muted-foreground text-xs uppercase">Active</p>
			<p class="text-xl leading-7 font-semibold">{activeTemplatesCount}</p>
		</div>
		<div class="bg-muted/65 rounded-xl border p-3">
			<p class="text-muted-foreground text-xs uppercase">Archived</p>
			<p class="text-xl leading-7 font-semibold">{archivedTemplatesCount}</p>
		</div>
	</div>
</section>
