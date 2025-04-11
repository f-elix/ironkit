<script lang="ts">
	import '../app.css';
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
<div class="mx-auto flex h-svh max-w-xl flex-col overflow-clip">
	{@render children()}
</div>
