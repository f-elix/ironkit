<script lang="ts">
	import { page } from '$app/state';
	import Header from '$lib/components/app/Header.svelte';

	let { children } = $props();

	let viewTransitionName = $derived(page.route.id?.includes('tools') ? 'tool' : 'main');
</script>

<div class="flex h-dvh flex-col overflow-y-auto">
	<Header />
	<div style="view-transition-name: {viewTransitionName};" class="flex grow flex-col">
		{@render children()}
	</div>
</div>
