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

	let { children } = $props();

	createSvelteAuthClient({ authClient });

	setupViewTransitions();
	watchOffline();
	watchSWUpdate();

	const auth = useAuth();
</script>

<Toaster closeButton richColors theme="dark" />
{#if auth.isLoading}
	<div class="flex h-dvh flex-col items-center justify-center">
		<Spinner class="size-10" />
	</div>
{:else}
	<Head />
	{@render children()}
{/if}
