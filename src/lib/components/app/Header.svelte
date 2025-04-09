<script lang="ts">
	import ThemeToggle from '$lib/components/app/ThemeToggle.svelte';
	import WidgetsMenu from '$lib/components/app/WidgetsMenu.svelte';
	import { PAGE__ROOT } from '$lib/ROUTES';
</script>

<header
	class="fixed bottom-0 left-0 flex w-full items-center justify-between gap-2 bg-sidebar px-4 py-2 text-sidebar-foreground"
>
	<a href={PAGE__ROOT} class="font-bold">Powerkit</a>
	<div class="flex items-center gap-2">
		<ThemeToggle />
		<WidgetsMenu />
	</div>
</header>
