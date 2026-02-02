<script lang="ts">
	import { page } from '$app/state';
	import PerformanceGroups from '$lib/components/training-log/PerformanceGroups.svelte';
	import WorkoutHeader from '$lib/components/training-log/WorkoutHeader.svelte';
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';

	const workoutId = page.params.id as Id<'workouts'>;
	const query = useQuery(api.workouts.getById, { id: workoutId });

	let workout = $derived(query.data);
</script>

{#if workout}
	<!-- Workout detail layout - works within parent layout scroll container -->
	<div class="flex min-h-full flex-col p-4 md:p-0" style="view-transition-name: workout;">
		<div class="flex grow flex-col gap-6">
			<WorkoutHeader {workout} />
			<PerformanceGroups {workoutId} />
		</div>
	</div>
{/if}
