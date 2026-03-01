<script lang="ts">
	import LogoSymbol from '$lib/components/svg/LogoSymbol.svelte';
	import Button from '$lib/shadcn/button/button.svelte';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import LogInIcon from '@lucide/svelte/icons/log-in';
	import { resolve } from '$app/paths';
	import { betterAuthClient } from '$lib/auth-client';
	import { AccountCoState, useIsAuthenticated } from 'jazz-tools/svelte';
	import { IronkitAccount } from '$lib/jazz/schema';

	const isAuthenticated = useIsAuthenticated();
	const account = new AccountCoState(IronkitAccount, {
		resolve: {
			profile: true
		}
	});
	const profile = $derived(account.current.$isLoaded ? account.current.profile : null);
</script>

<header
	class="text-sidebar-foreground bg-sidebar top-0 z-50 flex items-center justify-between gap-2 px-4 py-2 sm:py-4 md:sticky"
	style="view-transition-name: main-header;"
>
	<a href={resolve('/')} aria-label="Home">
		<LogoSymbol class="size-6 sm:size-8" />
	</a>
	{#if isAuthenticated.current}
		<div class="flex items-center gap-2">
			<p class="text-muted-foreground text-sm">
				{profile?.name}
			</p>
			<Button variant="ghost" size="sm" onclick={async () => await betterAuthClient.signOut()}>
				<LogOutIcon />
				Logout
			</Button>
		</div>
	{:else}
		<Button href={resolve('/auth')} variant="ghost" size="sm">
			<LogInIcon />
			Login
		</Button>
	{/if}
</header>
