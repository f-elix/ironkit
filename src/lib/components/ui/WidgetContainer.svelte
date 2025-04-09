<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="rounded-lg bg-muted/70 px-4 py-6">
	{@render children()}
</div>
