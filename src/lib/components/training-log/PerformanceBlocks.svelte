<script lang="ts">
	import { Button } from '$lib/shadcn/button';
	import { triplit } from '$lib/db/triplit';
	import { useQuery } from '@triplit/svelte';

	let { workoutId }: { workoutId: string } = $props();

	const query = useQuery(
		triplit,
		triplit.query('performanceBlocks').Where('workoutId', '=', workoutId).Order('order', 'ASC')
	);

	let performanceBlocks = $derived(query.results ?? []);

	const addPerformanceBlock = () => {
		triplit.insert('performanceBlocks', {
			workoutId,
			order: performanceBlocks.length
		});
	};
</script>

<div class="mt-6 flex flex-col gap-4">
	<ul class="flex flex-col gap-4">
		{#each performanceBlocks as performanceBlock (performanceBlock.id)}
			<li class="flex flex-col gap-2">
				<h2 class="text-lg font-semibold">{performanceBlock.label}</h2>
			</li>
		{/each}
	</ul>
	<Button variant="secondary" size="lg" onclick={addPerformanceBlock}>Add exercise</Button>
</div>
