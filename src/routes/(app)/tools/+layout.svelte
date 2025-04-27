<script lang="ts">
	import Button from '$lib/shadcn/button/button.svelte';
	import type { Snippet } from 'svelte';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import { PAGE__ROOT } from '$lib/ROUTES';
	import { page } from '$app/state';

	let { children }: { children: Snippet } = $props();

	let title = $derived(page.data.metaData?.title);
	let Icon = $derived(page.data.metaData?.Icon);
</script>

<div class="flex items-center justify-between gap-4 p-4">
	<Button variant="outline" size="icon" href={PAGE__ROOT} aria-label="Back to home">
		<ArrowLeftIcon />
	</Button>
	<h1 class="flex items-center justify-center gap-2 text-center text-sm font-medium">
		<Icon class="size-4" />
		{title}
	</h1>
</div>
{@render children()}
