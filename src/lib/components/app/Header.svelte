<script lang="ts">
	import LogoSymbol from '$lib/components/svg/LogoSymbol.svelte';
	import { convexAuthContext } from '$lib/db/ConvexAuth.svelte';
	import Button from '$lib/shadcn/button/button.svelte';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import LogInIcon from '@lucide/svelte/icons/log-in';
	import { resolve } from '$app/paths';

	const auth = convexAuthContext.get();

	let isAuthenticated = $derived(auth.isAuthenticated);
</script>

<header
	class="bg-sidebar text-sidebar-foreground flex items-center justify-between gap-2 px-4 py-2 sm:py-4"
	style="view-transition-name: main-header;"
>
	<a href={resolve('/')} aria-label="Home" class="w-6">
		<LogoSymbol class="size-6 sm:size-8" />
	</a>
	{#if isAuthenticated}
		<Button variant="ghost" size="sm" onclick={auth.signOut}>
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
