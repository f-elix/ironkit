<script lang="ts">
	import type { PerformanceSet, PerformanceWithRelations } from '$lib/db/types';

	let { performance }: { performance: PerformanceWithRelations } = $props();

	const showSummary = $derived(
		performance.sets?.some(
			(set) =>
				!!set.programTargetSetRange || !!set.programTargetRepsRange || !!set.programTargetDuration
		)
	);
	const exercise = $derived(performance.exercise);
	const sets = $derived(performance.sets ?? []);
	const executionType = $derived(exercise?.executionType ?? 'reps');

	const formatTargetValue = (value: string, executionType: 'reps' | 'time') => {
		if (/[a-zA-Z]/.test(value)) {
			return value;
		}
		return executionType === 'reps' ? `${value} reps` : `${value} sec`;
	};

	const formatSetRange = (set: PerformanceSet) => {
		const targetRange =
			executionType === 'reps'
				? set.programTargetRepsRange?.trim()
				: set.programTargetDuration?.trim();
		if (!targetRange) {
			return null;
		}
		const formattedTarget = formatTargetValue(targetRange, executionType);
		const programTargetSetRange = set.programTargetSetRange?.trim() || '1';
		const targetSetRange =
			programTargetSetRange === '1' ? '1 set' : `${programTargetSetRange} sets`;
		return `${targetSetRange} &times; ${formattedTarget}`;
	};
</script>

{#if showSummary}
	<div class="text-primary text-xs font-medium">
		<p>Planned:</p>
		<ul>
			{#each sets as set}
				<li>
					{@html formatSetRange(set)}
				</li>
			{/each}
		</ul>
	</div>
{/if}
