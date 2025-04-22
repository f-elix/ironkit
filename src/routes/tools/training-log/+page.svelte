<script lang="ts">
	import { PAGE_tools_training_log_workout_id } from '$lib/ROUTES';
	import { DEFAULT_WORKOUT_TITLE } from '$lib/constants';
	import { formatDate } from '$lib/ui/formatDate';
	import AddWorkout from '$lib/components/training-log/AddWorkout.svelte';

	let { data } = $props();

	let workouts = $derived(data.workouts);
</script>

<div class="grow px-4 pb-4">
	{#if workouts?.length}
		<div class="flex flex-col gap-4">
			<AddWorkout />
			{#each workouts as workout}
				{@const title = workout.title ?? DEFAULT_WORKOUT_TITLE}
				{@const date = workout.date}
				<a
					href={PAGE_tools_training_log_workout_id({ id: workout.id })}
					class="flex flex-col rounded-md border bg-muted/30 p-4"
				>
					<span class="text-lg font-bold">{title}</span>
					<span class="text-sm text-muted-foreground">{formatDate(date)}</span>
				</a>
			{/each}
		</div>
	{:else}
		<div
			class="flex h-full flex-col items-center justify-center gap-2 rounded-md border border-dashed p-4"
		>
			<h2 class="text-center text-2xl font-bold">No workouts yet</h2>
			<p class="mx-auto max-w-64 text-center leading-5 text-muted-foreground">
				Click the button below to create your first workout
			</p>
			<div class="h-6"></div>
			<AddWorkout />
		</div>
	{/if}
</div>
