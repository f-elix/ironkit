<script lang="ts">
	import { resolve } from '$app/paths';
	import { DEFAULT_WORKOUT_TITLE } from '$lib/constants';
	import type { Workout } from '$lib/jazz/types';
	import { formatDate } from '$lib/ui/formatDate';

	let { workout }: { workout: Workout } = $props();

	const title = $derived(workout.title ?? DEFAULT_WORKOUT_TITLE);
	const date = $derived(workout.date ? new Date(workout.date) : undefined);
</script>

<a
	href={resolve('/(app)/tools/training-log/workout-[id]', { id: workout.$jazz.id })}
	class="bg-card flex flex-col p-4"
>
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
