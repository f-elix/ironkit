<script lang="ts">
	import Header from '$lib/components/app/Header.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { useIsAuthenticated } from 'jazz-tools/svelte';
	import { setAuthUserProfile } from '$lib/setAuthUserProfile';

	let { children } = $props();

	const isAuthenticated = useIsAuthenticated();
	setAuthUserProfile();

	// Redirect to auth if not authenticated
	$effect(() => {
		if (!isAuthenticated.current) {
			goto(resolve('/auth'));
		}
	});
</script>

{#if isAuthenticated.current}
	<div class="flex h-dvh flex-col overflow-y-auto">
		<Header />
		<main style="view-transition-name: main;" class="flex grow flex-col">
			{@render children()}
		</main>
	</div>
{/if}
