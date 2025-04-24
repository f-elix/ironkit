<script lang="ts">
	import { triplit } from '$lib/db/triplit';
	import { useQuery } from '@triplit/svelte';

	let { exerciseId, upToDate }: { exerciseId: string; upToDate?: Maybe<Date> } = $props();

	const query = useQuery(
		triplit,
		triplit
			.query('performances')
			.Where([['exerciseId', '=', exerciseId], upToDate ? ['workout.date', '<', upToDate] : false])
			.Order('workout.date', 'DESC')
			.Limit(10)
			.Include('sets', (setsRel) => {
				return setsRel('sets').Order('performanceOrder', 'ASC');
			})
			.Include('workout')
	);

	let performances = $derived(query.results ?? []);
</script>

<div>
	{#each performances as performance (performance.id)}
		<pre>{JSON.stringify(performance.sets, null, 4)}</pre>
	{/each}
</div>
