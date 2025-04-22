<script lang="ts">
	import { triplit } from '$lib/db/triplit';
	import { useQuery } from '@triplit/svelte';
	import ExerciseSelection from '$lib/components/training-log/ExerciseSelection.svelte';

	let { workoutId }: { workoutId: string } = $props();

	const query = useQuery(
		triplit,
		triplit.query('performanceBlocks').Where('workoutId', '=', workoutId).Order('order', 'ASC')
	);

	let performanceBlocks = $derived(query.results ?? []);
</script>

<div class="mt-6 flex flex-col gap-4">
	<ul class="flex flex-col gap-4">
		{#each performanceBlocks as performanceBlock (performanceBlock.id)}
			<li class="flex flex-col gap-2">
				<h2 class="text-lg font-semibold">{performanceBlock.label}</h2>
			</li>
		{/each}
	</ul>
	<!-- <ExerciseSelectionDialog /> -->
	<ExerciseSelection />
</div>
