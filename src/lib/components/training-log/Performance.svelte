<script lang="ts">
	import type { WorkoutWithRelations } from '$lib/db/types';
	import PerformanceNote from '$lib/components/training-log/PerformanceNote.svelte';
	import PerformanceSets from '$lib/components/training-log/PerformanceSets.svelte';
	import UnitSelector from '$lib/components/ui/UnitSelector.svelte';
	import { triplit } from '$lib/db/triplit';
	import Button from '$lib/shadcn/button/button.svelte';
	import Trash from '@lucide/svelte/icons/trash-2';
	import ExerciseHistoryDialog from '$lib/components/training-log/ExerciseHistoryDialog.svelte';

	type Performance = WorkoutWithRelations['performanceGroups'][number]['performances'][number];

	let {
		performance,
		onDelete
	}: { performance: Performance; onDelete: (performanceId: string) => void } = $props();

	let exerciseName = $derived(performance.exercise?.name);
	let unit = $derived(performance.weightUnit);
</script>

<div class="flex flex-col gap-2">
	<div class="flex flex-col">
		<div class="flex items-center justify-between gap-2">
			<div class="flex items-center gap-1">
				<h3 class="text-xl font-semibold">{exerciseName}</h3>
				<ExerciseHistoryDialog {performance} />
			</div>
			<div class="flex items-center gap-2">
				<UnitSelector
					value={unit}
					onValueChange={(unit) => {
						triplit.update('performances', performance.id, { weightUnit: unit });
					}}
				/>
				<Button
					variant="destructive"
					size="icon"
					aria-label="Remove exercise"
					onclick={() => onDelete(performance.id)}
				>
					<Trash />
				</Button>
			</div>
		</div>
		<PerformanceNote {performance} />
	</div>
	<PerformanceSets {performance} />
</div>
