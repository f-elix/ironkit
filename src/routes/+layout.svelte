<script lang="ts">
	import '../app.css';
	import Head from '$lib/components/app/Head.svelte';
	import { Toaster } from '$lib/shadcn/sonner';
	import { watchOffline } from '$lib/ui/watchOffline';
	import { watchSWUpdate } from '$lib/ui/watchSWUpdate';
	import { setupViewTransitions } from '$lib/ui/setupViewTransitions';
	import { JazzSvelteProvider } from 'jazz-tools/svelte';
	import AuthProvider from 'jazz-tools/better-auth/auth/svelte';
	import { betterAuthClient } from '$lib/auth-client';
	import { Account } from '$lib/jazz/schema';
	import { PUBLIC_JAZZ_API_KEY } from '$env/static/public';

	let { children } = $props();

	setupViewTransitions();
	watchOffline();
	watchSWUpdate();

	const apiKey = PUBLIC_JAZZ_API_KEY;
	const jazzSyncPeer = `wss://cloud.jazz.tools/?key=${apiKey}`;
</script>

<Toaster closeButton richColors theme="dark" />
<JazzSvelteProvider sync={{ peer: jazzSyncPeer, when: 'signedUp' }} AccountSchema={Account}>
	<AuthProvider {betterAuthClient}>
		<Head />
		{@render children()}
	</AuthProvider>
</JazzSvelteProvider>
