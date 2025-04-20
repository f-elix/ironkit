<script lang="ts">
	import WorkoutInfoDialog from '$lib/components/training-log/WorkoutInfoDialog.svelte';
	import type { Workout } from '$lib/db/types';
	import { formatDate } from '$lib/ui/formatDate';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import { Button } from '$lib/shadcn/button';

	const {
		workout
	}: {
		workout: Workout;
	} = $props();

	let title = $derived(workout.title);
	let date = $derived(workout.date);
	let notes = $derived(workout.notes);
</script>

<header class="flex flex-col gap-3 rounded-sm border p-3">
	<div class="flex items-center justify-between gap-4">
		<h1 class="font-semibold">{title}</h1>
		<time class="text-sm text-muted-foreground" datetime={date.toISOString()}>
			{formatDate(date)}
		</time>
	</div>
	<div class="flex items-end justify-between gap-4">
		<p class={['self-start text-sm', !notes && 'text-muted-foreground']}>{notes || 'No notes'}</p>
		<WorkoutInfoDialog {workout}>
			{#snippet trigger({ props })}
				<Button {...props} size="icon" variant="ghost">
					<PencilIcon />
				</Button>
			{/snippet}
		</WorkoutInfoDialog>
	</div>
</header>
