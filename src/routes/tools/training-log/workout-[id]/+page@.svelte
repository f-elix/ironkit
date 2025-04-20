<script lang="ts">
	import { page } from '$app/state';
	import PerformanceBlocks from '$lib/components/training-log/PerformanceBlocks.svelte';
	import WorkoutHeader from '$lib/components/training-log/WorkoutHeader.svelte';
	import { triplit } from '$lib/db/triplit';
	import { useQuery } from '@triplit/svelte';

	const workoutId = page.params.id;
	const query = useQuery(triplit, triplit.query('workouts').Where('id', '=', workoutId));

	let workout = $derived(query.results?.[0]);
</script>

{#if workout}
	<div class="grow p-4">
		<WorkoutHeader {workout} />
		<PerformanceBlocks {workoutId} />
	</div>
{/if}
