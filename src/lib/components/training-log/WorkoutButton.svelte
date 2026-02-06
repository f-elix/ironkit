<script lang="ts">
	import { resolve } from '$app/paths';
	import { DEFAULT_WORKOUT_TITLE } from '$lib/constants';
	import { formatDate } from '$lib/ui/formatDate';
	import type { Doc } from '$convex/_generated/dataModel';

	let { workout }: { workout: Doc<'workouts'> } = $props();

	const title = $derived(workout.title ?? DEFAULT_WORKOUT_TITLE);
	const date = $derived(workout.date ? new Date(workout.date) : undefined);
	const href = $derived(resolve('/(app)/tools/training-log/workout-[id]', { id: workout._id }));
</script>

<a {href} class="bg-card flex flex-col p-4">
	<span class="text-lg font-bold">{title}</span>
	{#if date}
		<span class="text-muted-foreground text-sm">{formatDate(date)}</span>
	{/if}
	{#if workout.bodyweight != null}
		<span class="text-sm">
			<span class="font-medium">Bodyweight:</span>
			{workout.bodyweight}
			{workout.bodyweightUnit}
		</span>
	{/if}
	{#if workout.notes}
		<span class="mt-2 text-sm">{workout.notes}</span>
	{/if}
</a>
