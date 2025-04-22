<script lang="ts">
	import type { WorkoutWithRelations } from '$lib/db/types';
	import PerformanceSet from '$lib/components/training-log/PerformanceSet.svelte';

	type Performance = WorkoutWithRelations['performanceGroups'][number]['performances'][number];

	let { performance }: { performance: Performance } = $props();

	let exercise = $derived(performance.exercise?.name);
</script>

<div class="flex flex-col gap-2">
	<h3 class="font-semibold">{exercise}</h3>
	<ul class="flex flex-col gap-2">
		{#each performance.sets as set (set.id)}
			<li class="flex flex-col gap-2">
				<PerformanceSet {set} />
			</li>
		{/each}
	</ul>
</div>
