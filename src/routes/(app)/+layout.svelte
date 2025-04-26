<script lang="ts">
	import Header from '$lib/components/app/Header.svelte';

	let { children } = $props();
</script>

<div class="flex h-dvh flex-col overflow-y-auto">
	<Header />
	{@render children()}
</div>
