<script lang="ts">
	import Logo from '$lib/components/svg/Logo.svelte';
	import { PAGE__ROOT } from '$lib/ROUTES';
</script>

<header
	class="flex items-center justify-between gap-2 bg-sidebar px-4 py-2 text-sidebar-foreground"
>
	<a href={PAGE__ROOT} aria-label="Home" class="w-6">
		<Logo />
	</a>
</header>
