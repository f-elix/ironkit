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
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import Spinner from '$lib/shadcn/spinner/spinner.svelte';
	import { env } from '$env/dynamic/public';
	import { JazzAccount } from '$lib/jazz/schema';

	let { children } = $props();

	setupViewTransitions();
	watchOffline();
	watchSWUpdate();

	const auth = useAuth();
	const jazzSyncPeer = env.PUBLIC_JAZZ_SYNC_URL || 'wss://cloud.jazz.tools';
</script>

<Toaster closeButton richColors theme="dark" />
{#if auth.isLoading}
	<div class="flex h-dvh flex-col items-center justify-center">
		<Spinner class="size-10" />
	</div>
{:else}
	<JazzSvelteProvider sync={{ peer: jazzSyncPeer, when: 'signedUp' }} AccountSchema={JazzAccount}>
		<AuthProvider {betterAuthClient}>
			<Head />
			{@render children()}
		</AuthProvider>
	</JazzSvelteProvider>
{/if}
