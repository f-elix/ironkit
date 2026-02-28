<script lang="ts">
	import Separator from '$lib/shadcn/separator/separator.svelte';
	import { getPerformanceGroupLabel } from '$lib/training-log/performance-group.utils';
	import LinkIcon from '@lucide/svelte/icons/link';
	import type { ResolvedPerformanceGroup } from '$lib/jazz/types';
	import type { ProgramTarget } from '$lib/jazz/schema';

	let { performanceGroups }: { performanceGroups: ResolvedPerformanceGroup[] } = $props();

	const showableGroups = $derived(
		performanceGroups.filter((group) => !!group.performances.flatMap((p) => p.exercise).length)
	);

	const totalExercises = $derived(
		showableGroups.reduce(
			(acc, group) => acc + group.performances.flatMap((p) => p.exercise).length,
			0
		)
	);

	function formatSetCompact(set: ProgramTarget, executionType: 'reps' | 'time') {
		const sets = set.targetSetRange ?? '1';
		const reps =
			executionType === 'reps' ? (set.targetRepsRange ?? '—') : (set.targetDuration ?? '—');
		return { sets, reps };
	}

	function getSetRanges(sets: ProgramTarget[], executionType: 'reps' | 'time') {
		return sets.map((s) => formatSetCompact(s, executionType));
	}
</script>

<div class="space-y-3">
	<div class="text-muted-foreground/60 text-xs font-medium">
		{#if showableGroups.length}
			{totalExercises} exercise{totalExercises !== 1 ? 's' : ''}
		{:else}
			No exercises
		{/if}
	</div>
	{#if showableGroups.length}
		<div class="space-y-2">
			{#each showableGroups as group, groupIndex}
				{@const isGrouped = group.performances.length > 1}
				{@const groupLabel = isGrouped
					? getPerformanceGroupLabel(group.performances.length, group.label)
					: null}
				<div class={['relative', isGrouped && 'bg-muted/20 -mx-1 rounded-md px-1 py-2']}>
					{#if groupLabel}
						<div class="mb-1 flex items-center gap-1.5">
							<LinkIcon class="text-muted-foreground/50 size-4" />
							<span class="text-muted-foreground/70 text-xs font-semibold">
								{groupLabel}
							</span>
						</div>
					{/if}
					<ul class={['space-y-2.5', isGrouped && 'pl-1']}>
						{#each group.performances as performance}
							{@const exercise = performance.exercise}
							{@const setRanges = getSetRanges(
								performance.programTargets ?? [],
								exercise.executionType
							)}
							<li class="flex flex-col gap-2">
								<span class="text-sm font-medium">
									{exercise.name}
								</span>
								{#if setRanges.length > 0}
									<ul class="flex flex-col gap-1.5">
										{#each setRanges as range}
											<li
												class="text-muted-foreground flex items-center gap-1.5 text-sm tabular-nums"
											>
												<span class="bg-muted/50 rounded px-1 py-px font-medium">
													{range.sets} sets
												</span>
												<span class="text-muted-foreground/50">×</span>
												<span class="bg-muted/50 rounded px-1 py-px font-medium">
													{range.reps}{exercise.executionType === 'reps' ? ' reps' : ''}
												</span>
											</li>
										{/each}
									</ul>
								{/if}
							</li>
						{/each}
					</ul>
				</div>
				{#if groupIndex < showableGroups.length - 1}
					<Separator class="bg-border/20" />
				{/if}
			{/each}
		</div>
	{/if}
</div>
