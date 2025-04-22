<script lang="ts">
	import PerformanceSet from '$lib/components/training-log/PerformanceSet.svelte';
	import type { WorkoutWithRelations } from '$lib/db/types';

	type Performance = WorkoutWithRelations['performanceGroups'][number]['performances'][number];

	let { performance }: { performance: Performance } = $props();

	let sets = $derived(performance.sets);
</script>

<ul class="flex flex-col gap-2">
	{#each sets as set (set.id)}
		<li>
			<PerformanceSet {set} />
		</li>
	{/each}
</ul>
