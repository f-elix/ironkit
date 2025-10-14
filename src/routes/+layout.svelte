<script lang="ts">
	import '../app.css';
	import Head from '$lib/components/app/Head.svelte';
	import { Toaster } from '$lib/shadcn/sonner';
	import { watchOffline } from '$lib/ui/watchOffline';
	import { watchSWUpdate } from '$lib/ui/watchSWUpdate';
	import { setupViewTransitions } from '$lib/ui/setupViewTransitions';
	import { setConvexAuth } from '$lib/db/ConvexAuth.svelte';

	let { children } = $props();

	setupViewTransitions();
	watchOffline();
	watchSWUpdate();
	setConvexAuth();
</script>

<Head />
<Toaster closeButton richColors theme="dark" />
<aside class="bg-sidebar-primary hidden p-2 text-center md:block">
	<p class="font-medium">This app is optimized for mobile. The desktop version is coming soon.</p>
</aside>
{@render children()}
