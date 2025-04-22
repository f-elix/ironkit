<script lang="ts">
	import Performance from '$lib/components/training-log/Performance.svelte';
	import type { WorkoutWithRelations } from '$lib/db/types';

	type Group = WorkoutWithRelations['performanceGroups'][number];

	let { performanceGroup }: { performanceGroup: Group } = $props();

	let label = $derived(performanceGroup.label);
	let performances = $derived(performanceGroup.performances);
</script>

<div class="flex flex-col gap-2 rounded-sm bg-secondary p-2 text-secondary-foreground">
	{#if label}
		<h2 class="text-lg font-semibold">{label}</h2>
	{/if}
	<ul class="flex flex-col gap-2">
		{#each performances as performance (performance.id)}
			<li class="flex flex-col gap-2">
				<Performance {performance} />
			</li>
		{/each}
	</ul>
</div>
