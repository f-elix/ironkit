<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/app/Header.svelte';
	import Head from '$lib/components/app/Head.svelte';
	import { onNavigate } from '$app/navigation';

	let { children } = $props();

	onNavigate((navigation) => {
		if (!document.startViewTransition) {
			return;
		}
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

<Head />
<div class="flex h-svh flex-col overflow-clip">
	<Header />
	{@render children()}
</div>
