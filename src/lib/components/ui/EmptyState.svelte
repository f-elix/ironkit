<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		icon,
		description,
		button
	}: { title?: string; icon?: Snippet; description?: Snippet; button?: Snippet } = $props();
</script>

<div
	class="flex size-full flex-col items-center justify-center gap-2 rounded-md border border-dashed p-4"
>
	{#if icon}
		<div class="mb-2">
			{@render icon()}
		</div>
	{/if}
	{#if title}
		<h2 class="text-center text-2xl font-bold">{title}</h2>
	{/if}
	{#if description}
		<p class="text-muted-foreground text-center leading-5">
			{@render description()}
		</p>
	{/if}
	{#if button}
		<div class="h-6"></div>
		{@render button()}
	{/if}
</div>
