<script lang="ts">
	import type { PerformanceWithRelations } from '$lib/db/types';

	let { performance }: { performance: PerformanceWithRelations } = $props();

	const exercise = $derived(performance.exercise);
	const programTargets = $derived(performance.programTargets ?? []);
	const executionType = $derived(exercise?.executionType ?? 'reps');
	const showSummary = $derived(
		programTargets.some((target) =>
			executionType === 'reps' ? !!target.targetRepsRange?.trim() : !!target.targetDuration?.trim()
		)
	);

	const formatTargetValue = (value: string, executionType: 'reps' | 'time') => {
		if (/[a-zA-Z]/.test(value)) {
			return value;
		}
		return executionType === 'reps' ? `${value} reps` : `${value} sec`;
	};

	const formatSetRange = (
		target: NonNullable<PerformanceWithRelations['programTargets']>[number]
	) => {
		const targetRange =
			executionType === 'reps' ? target.targetRepsRange?.trim() : target.targetDuration?.trim();
		if (!targetRange) {
			return null;
		}
		const formattedTarget = formatTargetValue(targetRange, executionType);
		const programTargetSetRange = target.targetSetRange?.trim() || '1';
		const targetSetRange =
			programTargetSetRange === '1' ? '1 set' : `${programTargetSetRange} sets`;
		return `${targetSetRange} &times; ${formattedTarget}`;
	};
</script>

{#if showSummary}
	<div class="text-primary bg-muted/50 space-y-2 rounded-xl border p-2">
		<p class="text-xs">Planned:</p>
		<ul class="text-sm font-medium">
			{#each programTargets as target, index (`${index}-${target.targetSetRange}`)}
				{@const formatted = formatSetRange(target)}
				{#if formatted}
					<li>
						{#if programTargets.length > 1}
							-
						{/if}
						{@html formatted}
					</li>
				{/if}
			{/each}
		</ul>
	</div>
{/if}
