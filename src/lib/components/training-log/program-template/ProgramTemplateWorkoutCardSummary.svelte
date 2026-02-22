<script lang="ts">
	import type { WorkoutSummaryGroup } from '$lib/components/training-log/program-template/program-template-editor.types';
	import Separator from '$lib/shadcn/separator/separator.svelte';
	import { getPerformanceGroupLabel } from '$lib/training-log/performance-group.utils';
	import LinkIcon from '@lucide/svelte/icons/link';

	let { groups }: { groups: WorkoutSummaryGroup[] } = $props();

	const showableGroups = $derived(groups.filter((group) => !!group.exercises.length));

	const totalExercises = $derived(
		showableGroups.reduce((acc, group) => acc + group.exercises.length, 0)
	);

	function formatSetCompact(
		set: { targetSetRange?: string; targetRepsRange?: string; targetDuration?: string },
		executionType: 'reps' | 'time'
	): { sets: string; reps: string } {
		const sets = set.targetSetRange ?? '1';
		const reps =
			executionType === 'reps' ? (set.targetRepsRange ?? '—') : (set.targetDuration ?? '—');
		return { sets, reps };
	}

	function getSetRanges(
		sets: { targetSetRange?: string; targetRepsRange?: string; targetDuration?: string }[],
		executionType: 'reps' | 'time'
	): { sets: string; reps: string }[] {
		if (!sets.length) {
			return [];
		}
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
				{@const isGrouped = group.exercises.length > 1}
				{@const groupLabel = isGrouped
					? getPerformanceGroupLabel(group.exercises.length, group.label)
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
						{#each group.exercises as exercise}
							{@const setRanges = getSetRanges(exercise.sets, exercise.executionType)}
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
