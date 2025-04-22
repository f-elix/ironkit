<script lang="ts">
	import type { WorkoutWithRelations } from '$lib/db/types';
	import PerformanceNote from '$lib/components/training-log/PerformanceNote.svelte';
	import PerformanceSets from '$lib/components/training-log/PerformanceSets.svelte';

	type Performance = WorkoutWithRelations['performanceGroups'][number]['performances'][number];

	let { performance }: { performance: Performance } = $props();

	let exercise = $derived(performance.exercise?.name);
</script>

<div class="flex flex-col gap-4">
	<h3 class="font-semibold">{exercise}</h3>
	<PerformanceNote {performance} />
	<PerformanceSets {performance} />
</div>
