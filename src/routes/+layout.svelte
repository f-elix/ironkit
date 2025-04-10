<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/app/Header.svelte';
	import Head from '$lib/components/app/Head.svelte';
	import { watchOffline } from '$lib/ui/watchOffline';
	import { watchSWUpdate } from '$lib/ui/watchSWUpdate';
	import { setupViewTransition } from '$lib/ui/setupViewTransition';
	import { Toaster } from '$lib/components/ui/sonner';

	let { children } = $props();

	setupViewTransition();
	watchOffline();
	watchSWUpdate();
</script>

<Head />
<Toaster closeButton richColors theme="dark" />
<div class="flex h-svh flex-col overflow-clip">
	<Header />
	{@render children()}
</div>
