<script lang="ts">
	import Button from '$lib/shadcn/button/button.svelte';
	import type { Snippet } from 'svelte';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	let { children }: { children: Snippet } = $props();

	let title = $derived(page.data.metaData?.title);
	let Icon = $derived(page.data.metaData?.Icon);

	// Hide header for workout detail pages (they have their own integrated header)
	let isWorkoutDetailPage = $derived(page.url.pathname.includes('/workout-'));
</script>

{#if !isWorkoutDetailPage}
	<div class="flex items-center justify-between gap-4 p-4 md:hidden">
		<Button variant="outline" size="icon" href={resolve('/')} aria-label="Back to home">
			<ArrowLeftIcon />
		</Button>
		<h1 class="flex items-center justify-center gap-2 text-center text-sm font-medium">
			<Icon class="size-4" />
			{title}
		</h1>
	</div>
{/if}
{@render children()}
