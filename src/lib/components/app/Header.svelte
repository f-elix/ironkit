<script lang="ts">
	import LogoSymbol from '$lib/components/svg/LogoSymbol.svelte';
	import { authContext } from '$lib/db/Auth.svelte';
	import { PAGE__ROOT, PAGE_auth } from '$lib/ROUTES';
	import Button from '$lib/shadcn/button/button.svelte';

	const auth = authContext.get();

	let user = $derived(auth.user);
</script>

<header
	class="flex items-center justify-between gap-2 bg-sidebar px-4 py-2 text-sidebar-foreground"
>
	<a href={PAGE__ROOT} aria-label="Home" class="w-6">
		<LogoSymbol class="size-6" />
	</a>
	{#if user}
		<Button variant="ghost" size="sm" onclick={auth.signOut}>Logout</Button>
	{:else}
		<Button href={PAGE_auth} variant="ghost" size="sm">Login</Button>
	{/if}
</header>
