<script lang="ts">
	import LogoSymbol from '$lib/components/svg/LogoSymbol.svelte';
	import { PAGE__ROOT } from '$lib/ROUTES';
</script>

<header class="flex items-center justify-between gap-2 bg-sidebar p-4 text-sidebar-foreground">
	<a href={PAGE__ROOT} aria-label="Home" class="w-6">
		<LogoSymbol class="size-6" />
	</a>
</header>
