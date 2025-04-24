<script lang="ts">
	import WorkoutInfoDialog from '$lib/components/training-log/WorkoutInfoDialog.svelte';
	import type { Workout } from '$lib/db/types';
	import { formatDate } from '$lib/ui/formatDate';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import { Button } from '$lib/shadcn/button';
	import XIcon from '@lucide/svelte/icons/x';
	import { PAGE_tools_training_log } from '$lib/ROUTES';

	const {
		workout
	}: {
		workout: Workout;
	} = $props();

	let title = $derived(workout.title);
	let date = $derived(workout.date);
	let notes = $derived(workout.notes);
</script>

<header class="flex flex-col gap-2">
	<Button
		href={PAGE_tools_training_log}
		variant="outline"
		size="icon"
		aria-label="Back to training log"
	>
		<XIcon />
	</Button>
	<div class="flex flex-col gap-4">
		<div class="flex items-center justify-between gap-4">
			<h1 class="text-2xl font-semibold">{title}</h1>
			<time class="ml-auto text-sm text-muted-foreground" datetime={date.toISOString()}>
				{formatDate(date)}
			</time>
			<WorkoutInfoDialog {workout}>
				{#snippet trigger({ props })}
					<Button {...props} size="icon" variant="ghost">
						<PencilIcon />
					</Button>
				{/snippet}
			</WorkoutInfoDialog>
		</div>
		{#if notes}
			<div class="flex items-end justify-between gap-4">
				<p class="text-sm">{notes}</p>
			</div>
		{/if}
	</div>
</header>
