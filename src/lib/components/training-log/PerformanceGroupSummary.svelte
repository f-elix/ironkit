<script lang="ts">
	import PerformanceSetSummary from '$lib/components/training-log/PerformanceSetSummary.svelte';
	import Badge from '$lib/shadcn/badge/badge.svelte';
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';

	import type { Id } from '$convex/_generated/dataModel';

	let { performanceGroupId }: { performanceGroupId: Id<'performanceGroups'> } = $props();

	const query = useQuery(api.performanceGroups.getById, { id: performanceGroupId });

	let performanceGroup = $derived(query.data);
	let label = $derived(performanceGroup?.label);
	let performances = $derived(performanceGroup?.performances ?? []);
</script>

<div class="flex w-full flex-col items-start gap-4 py-2 text-left whitespace-normal">
	{#if label && performances.length > 1}
		<Badge>{label}</Badge>
	{/if}
	{#each performances as performance (performance._id)}
		{@const exercise = performance.exercise}
		{@const sets =
			performance.sets?.filter(
				(set) =>
					(set.weight && set.weight > 0) ||
					(set.reps && set.reps > 0) ||
					(set.durationSeconds && set.durationSeconds > 0)
			) ?? []}
		{@const note = performance.note}
		<div class="flex w-full flex-col gap-4">
			<div>
				<p class="text-base font-semibold">
					{exercise?.name}
				</p>
				{#if note}
					<p class="text-muted-foreground text-sm whitespace-normal">{note}</p>
				{/if}
			</div>
			{#if sets.length}
				<ol class="flex flex-col gap-2">
					{#each sets as set, i (set._id)}
						<li>
							<PerformanceSetSummary {set} {performance} order={i + 1} />
						</li>
					{/each}
				</ol>
			{/if}
		</div>
	{/each}
</div>
