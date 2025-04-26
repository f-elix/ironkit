<script lang="ts">
	import LogoSymbol from '$lib/components/svg/LogoSymbol.svelte';
	import { PAGE__ROOT, PAGE_auth } from '$lib/ROUTES';
	import Button from '$lib/shadcn/button/button.svelte';
</script>

<header
	class="flex items-center justify-between gap-2 bg-sidebar px-4 py-2 text-sidebar-foreground"
>
	<a href={PAGE__ROOT} aria-label="Home" class="w-6">
		<LogoSymbol class="size-6" />
	</a>
	<Button href={PAGE_auth} variant="ghost" size="sm">Login</Button>
</header>
