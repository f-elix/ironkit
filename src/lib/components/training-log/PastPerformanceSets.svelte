<script lang="ts">
	import PerformanceSetSummary from '$lib/components/training-log/PerformanceSetSummary.svelte';
	import { Performance } from '$lib/jazz/schema';
	import { CoState } from 'jazz-tools/svelte';

	let { performanceId, bodyweight = 0 }: { performanceId: string; bodyweight: number } = $props();

	const performanceState = new CoState(Performance, () => performanceId, {
		resolve: {
			exercise: true,
			performanceSets: { $each: { $onError: 'catch' } }
		}
	});

	const performance = $derived(performanceState.current.$isLoaded ? performanceState.current : null);
	const sets = $derived(
		performance?.performanceSets.$isLoaded
			? Array.from(performance.performanceSets).filter((s) => s.$isLoaded)
			: []
	);
</script>

{#if sets.length && performance}
	<ul class="flex flex-col gap-2">
		{#each sets as set, i (set.$jazz.id)}
			<li class="flex w-full items-baseline gap-2">
				<PerformanceSetSummary {set} {performance} order={i + 1} />
			</li>
		{/each}
	</ul>
{/if}
