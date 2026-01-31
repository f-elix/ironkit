<script lang="ts">
	import Header from '$lib/components/app/Header.svelte';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Spinner from '$lib/shadcn/spinner/spinner.svelte';

	let { children } = $props();

	const auth = useAuth();

	// Redirect to auth if not authenticated
	$effect(() => {
		if (!auth.isLoading && !auth.isAuthenticated) {
			goto(resolve('/auth'));
		}
	});
</script>

{#if auth.isLoading}
	<div class="flex h-dvh items-center justify-center">
		<Spinner class="size-10" />
	</div>
{:else if auth.isAuthenticated}
	<div class="flex h-dvh flex-col overflow-y-auto">
		<Header />
		<main style="view-transition-name: main;" class="flex grow flex-col">
			{@render children()}
		</main>
	</div>
{/if}
