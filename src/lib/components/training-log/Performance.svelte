<script lang="ts">
	import type { WorkoutWithRelations } from '$lib/db/types';
	import PerformanceNote from '$lib/components/training-log/PerformanceNote.svelte';
	import PerformanceSets from '$lib/components/training-log/PerformanceSets.svelte';
	import UnitSelector from '$lib/components/ui/UnitSelector.svelte';
	import { triplit } from '$lib/db/triplit';
	import Button from '$lib/shadcn/button/button.svelte';
	import Trash from '@lucide/svelte/icons/trash';
	import ExerciseHistoryDialog from '$lib/components/training-log/ExerciseHistoryDialog.svelte';

	type Performance = WorkoutWithRelations['performanceGroups'][number]['performances'][number];

	let {
		performance,
		onDelete
	}: { performance: Performance; onDelete: (performanceId: string) => void } = $props();

	let exerciseName = $derived(performance.exercise?.name);
	let unit = $derived(performance.weightUnit);
</script>

<div class="relative flex flex-col gap-6">
	<Button
		variant="destructive"
		size="icon"
		aria-label="Remove exercise"
		class="absolute right-0 top-0 size-6 [&_svg]:size-3"
		onclick={() => onDelete(performance.id)}
	>
		<Trash />
	</Button>
	<h3 class="max-w-[80%] text-lg font-semibold leading-5">
		{exerciseName}
	</h3>
	<div class="flex flex-col gap-4">
		<div class="flex items-start justify-between gap-2">
			<div class="grow">
				<PerformanceNote {performance} />
			</div>
			<div class="flex items-center gap-1">
				<UnitSelector
					value={unit}
					onValueChange={(unit) => {
						triplit.update('performances', performance.id, { weightUnit: unit });
					}}
				/>
				<ExerciseHistoryDialog {performance} />
			</div>
		</div>
		<PerformanceSets {performance} />
	</div>
</div>
