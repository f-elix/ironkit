<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import type { Snippet } from 'svelte';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import { PAGE__ROOT } from '$lib/ROUTES';
	import { page } from '$app/state';

	let { children }: { children: Snippet } = $props();

	let title = $derived(page.data.title);
	let Icon = $derived(page.data.icon);
</script>

<div class="flex items-center justify-between gap-4 p-4">
	<Button variant="outline" size="icon" href={PAGE__ROOT} aria-label="Back to home">
		<ArrowLeftIcon class="size-4" />
	</Button>
	<h1
		class="flex items-center justify-center gap-2 text-center"
		style="view-transition-name: widget-title;"
	>
		<Icon class="size-4" />
		{title}
	</h1>
</div>
{@render children()}
