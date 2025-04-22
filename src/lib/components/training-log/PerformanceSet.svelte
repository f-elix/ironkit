<script lang="ts">
	import type { PerformanceSet } from '$lib/db/types';

	let { set }: { set: PerformanceSet } = $props();

	let weight = $state(set.weight);
	let unit = $state(set.unit);
</script>

<div class="flex flex-col gap-2">
	<p class="text-sm text-muted-foreground">{set.weight} {set.unit}</p>
</div>
