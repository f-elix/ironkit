<script lang="ts">
	import { page } from '$app/state';
	import PerformanceGroups from '$lib/components/training-log/PerformanceGroups.svelte';
	import WorkoutHeader from '$lib/components/training-log/WorkoutHeader.svelte';
	import { triplit } from '$lib/db/triplit';
	import Button from '$lib/shadcn/button/button.svelte';
	import { useQuery } from '@triplit/svelte';
	import Check from '@lucide/svelte/icons/check';
	import { PAGE_tools_training_log } from '$lib/ROUTES';

	const workoutId = page.params.id;
	const query = useQuery(triplit, triplit.query('workouts').Where('id', '=', workoutId));

	let workout = $derived(query.results?.[0]);
</script>

{#if workout}
	<div class="flex grow flex-col">
		<div class="p-4">
			<WorkoutHeader {workout} />
			<PerformanceGroups {workoutId} />
		</div>
		<div class="mt-auto flex w-full flex-col p-4">
			<Button href={PAGE_tools_training_log} size="lg" class="bg-emerald-500">
				Finish workout
				<Check />
			</Button>
		</div>
	</div>
{/if}
