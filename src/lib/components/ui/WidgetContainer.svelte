<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="bg-muted/70 rounded-lg px-4 py-6">
	{@render children()}
</div>
