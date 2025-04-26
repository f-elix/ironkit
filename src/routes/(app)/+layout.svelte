<script lang="ts">
	import Header from '$lib/components/app/Header.svelte';

	let { children } = $props();
</script>

<div class="mx-auto flex h-dvh max-w-xl flex-col overflow-y-auto">
	<Header />
	{@render children()}
</div>
