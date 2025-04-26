<script lang="ts">
	import '../app.css';
	import Head from '$lib/components/app/Head.svelte';
	import { Toaster } from '$lib/shadcn/sonner';
	import { loadDb } from '$lib/db/loadDb';
	import { watchOffline } from '$lib/ui/watchOffline';
	import { watchSWUpdate } from '$lib/ui/watchSWUpdate';
	import { setupViewTransition } from '$lib/ui/setupViewTransition';
	import { setAuth } from '$lib/db/Auth.svelte';

	let { children } = $props();

	setupViewTransition();
	watchOffline();
	watchSWUpdate();
	loadDb();
	setAuth();
</script>

<Head />
<Toaster closeButton richColors theme="dark" />

<div class="mx-auto max-w-xl">
	{@render children()}
</div>
