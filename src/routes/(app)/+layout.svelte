<script lang="ts">
	import Header from '$lib/components/app/Header.svelte';

	let { children } = $props();
</script>

<div class="flex h-dvh flex-col overflow-y-auto">
	<Header />
	<div style="view-transition-name: main;" class="flex grow flex-col">
		{@render children()}
	</div>
</div>
