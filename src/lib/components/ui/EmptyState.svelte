<script lang="ts">
	import type { Snippet } from 'svelte';

	let { title, description, button }: { title?: string; description?: Snippet; button?: Snippet } =
		$props();
</script>

<div
	class="flex h-full flex-col items-center justify-center gap-2 rounded-md border border-dashed p-4"
>
	{#if title}
		<h2 class="text-center text-2xl font-bold">{title}</h2>
	{/if}
	{#if description}
		<p class="text-center leading-5 text-muted-foreground">
			{@render description()}
		</p>
	{/if}
	{#if button}
		<div class="h-6"></div>
		{@render button()}
	{/if}
</div>
