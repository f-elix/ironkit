<script lang="ts">
	import LogoSymbol from '$lib/components/svg/LogoSymbol.svelte';
	import Button from '$lib/shadcn/button/button.svelte';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import LogInIcon from '@lucide/svelte/icons/log-in';
	import { resolve } from '$app/paths';
	import { betterAuthClient } from '$lib/auth-client';
	import { useIsAuthenticated } from 'jazz-tools/svelte';

	const isAuthenticated = useIsAuthenticated();
</script>

<header
	class="text-sidebar-foreground bg-sidebar top-0 z-50 flex items-center justify-between gap-2 px-4 py-2 sm:py-4 md:sticky"
	style="view-transition-name: main-header;"
>
	<a href={resolve('/')} aria-label="Home">
		<LogoSymbol class="size-6 sm:size-8" />
	</a>
	{#if isAuthenticated.current}
		<Button variant="ghost" size="sm" onclick={async () => await betterAuthClient.signOut()}>
			<LogOutIcon />
			Logout
		</Button>
	{:else}
		<Button href={resolve('/auth')} variant="ghost" size="sm">
			<LogInIcon />
			Login
		</Button>
	{/if}
</header>
