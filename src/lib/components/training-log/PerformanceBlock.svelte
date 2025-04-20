<script lang="ts">
	import type { PerformanceBlock } from '$lib/db/types';

	let { block }: { block: PerformanceBlock } = $props();
</script>

<div class="rounded-sm bg-card p-4">
	<h2 class="text-lg font-semibold">{block.label}</h2>
</div>
