<script lang="ts">
	import { triplit } from '$lib/db/triplit';
	import { useQuery } from '@triplit/svelte';
	import ExerciseSelection from '$lib/components/training-log/ExerciseSelection.svelte';
	import PerformanceGroup from '$lib/components/training-log/PerformanceGroup.svelte';

	let { workoutId }: { workoutId: string } = $props();

	const query = useQuery(
		triplit,
		triplit
			.query('performanceGroups')
			.Where('workoutId', '=', workoutId)
			.Order('workoutOrder', 'ASC')
			.Include('performances', (rel) => {
				return rel('performances')
					.Order('groupOrder', 'ASC')
					.Include('exercise')
					.Include('sets', (setsRel) => {
						return setsRel('sets').Order('performanceOrder', 'ASC');
					});
			})
	);

	let performanceGroups = $derived(query.results ?? []);
	let lastOrder = $derived(performanceGroups?.at(-1)?.workoutOrder ?? 0);
</script>

<div class="mt-6 flex flex-col gap-4">
	<ul class="flex flex-col gap-4">
		{#each performanceGroups as performanceGroup (performanceGroup.id)}
			<li class="flex flex-col gap-2">
				<PerformanceGroup {performanceGroup} />
			</li>
		{/each}
	</ul>
	<ExerciseSelection {workoutId} {lastOrder} />
</div>
