<script lang="ts">
	import { page } from '$app/state';
	import PerformanceGroups from '$lib/components/training-log/PerformanceGroups.svelte';
	import WorkoutHeader from '$lib/components/training-log/WorkoutHeader.svelte';
	import Button from '$lib/shadcn/button/button.svelte';
	import { useQuery } from 'convex-svelte';
	import Check from '@lucide/svelte/icons/check';
	import { resolve } from '$app/paths';
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';

	const workoutId = page.params.id as Id<'workouts'>;
	const query = useQuery(api.workouts.getById, { id: workoutId });

	let workout = $derived(query.data);
</script>

{#if workout}
	<div class="flex h-dvh flex-col" style="view-transition-name: workout;">
		<div class="flex grow flex-col gap-6 p-4 pb-0">
			<WorkoutHeader {workout} />
			<PerformanceGroups {workoutId} />
		</div>
		<div class="mt-auto flex w-full flex-col p-4">
			<Button href={resolve('/(app)/tools/training-log')} size="lg" class="bg-emerald-500">
				Done
				<Check />
			</Button>
		</div>
	</div>
{/if}
