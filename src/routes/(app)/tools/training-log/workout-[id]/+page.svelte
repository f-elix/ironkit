<script lang="ts">
	import { page } from '$app/state';
	import WorkoutEditor from '$lib/components/training-log/WorkoutEditor.svelte';
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';

	const workoutId = page.params.id as Id<'workouts'>;
	const query = useQuery(api.workouts.getById, { id: workoutId });

	let workout = $derived(query.data);
</script>

{#key workoutId}
	{#if workout}
		<div class="min-h-full" style="view-transition-name: workout;">
			<WorkoutEditor {workoutId} {workout} />
		</div>
	{/if}
{/key}
