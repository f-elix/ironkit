<script lang="ts">
	import '../app.css';
	import Head from '$lib/components/app/Head.svelte';
	import { Toaster } from '$lib/shadcn/sonner';
	import { watchOffline } from '$lib/ui/watchOffline';
	import { watchSWUpdate } from '$lib/ui/watchSWUpdate';
	import { setupViewTransitions } from '$lib/ui/setupViewTransitions';
	import { createSvelteAuthClient } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { authClient } from '$lib/auth-client';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import Spinner from '$lib/shadcn/spinner/spinner.svelte';
	import { setupConvex } from 'convex-svelte';
	import { PUBLIC_CONVEX_URL } from '$env/static/public';

	let { children } = $props();

	createSvelteAuthClient({ authClient });
	setupConvex(PUBLIC_CONVEX_URL);

	setupViewTransitions();
	watchOffline();
	watchSWUpdate();

	const auth = useAuth();
</script>

{#if auth.isLoading}
	<div class="flex h-dvh flex-col items-center justify-center">
		<Spinner class="size-10" />
	</div>
{:else}
	<Head />
	<Toaster closeButton richColors theme="dark" />
	<aside class="bg-sidebar-primary hidden p-2 text-center md:block">
		<p class="font-medium">This app is optimized for mobile. The desktop version is coming soon.</p>
	</aside>
	{@render children()}
{/if}
