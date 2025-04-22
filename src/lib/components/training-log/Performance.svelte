<script lang="ts">
	import type { WorkoutWithRelations } from '$lib/db/types';
	import PerformanceNote from '$lib/components/training-log/PerformanceNote.svelte';
	import PerformanceSets from '$lib/components/training-log/PerformanceSets.svelte';
	import UnitSelector from '$lib/components/ui/UnitSelector.svelte';
	import { triplit } from '$lib/db/triplit';

	type Performance = WorkoutWithRelations['performanceGroups'][number]['performances'][number];

	let { performance }: { performance: Performance } = $props();

	let exercise = $derived(performance.exercise?.name);
	let unit = $derived(performance.weightUnit);
</script>

<div class="flex flex-col gap-2">
	<div class="flex flex-col">
		<div class="flex items-center justify-between gap-4">
			<h3 class="font-semibold">{exercise}</h3>
			<UnitSelector
				value={unit}
				onValueChange={(unit) => {
					triplit.update('performances', performance.id, { weightUnit: unit });
				}}
			/>
		</div>
		<PerformanceNote {performance} />
	</div>
	<PerformanceSets {performance} />
</div>
