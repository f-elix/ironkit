<script lang="ts">
	import LogoSymbol from '$lib/components/svg/LogoSymbol.svelte';
	import { authContext } from '$lib/db/Auth.svelte';
	import { PAGE__ROOT, PAGE_auth } from '$lib/ROUTES';
	import Button from '$lib/shadcn/button/button.svelte';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import LogInIcon from '@lucide/svelte/icons/log-in';

	const auth = authContext.get();

	let user = $derived(auth.user);
</script>

<header
	class="flex items-center justify-between gap-2 bg-sidebar px-4 py-2 text-sidebar-foreground sm:py-4"
	style="view-transition-name: main-header;"
>
	<a href={PAGE__ROOT} aria-label="Home" class="w-6">
		<LogoSymbol class="size-6 sm:size-8" />
	</a>
	{#if user}
		<Button variant="ghost" size="sm" onclick={auth.signOut}>
			<LogOutIcon />
			Logout
		</Button>
	{:else}
		<Button href={PAGE_auth} variant="ghost" size="sm">
			<LogInIcon />
			Login
		</Button>
	{/if}
</header>
