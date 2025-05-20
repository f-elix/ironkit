<script lang="ts">
	import WorkoutInfoDialog from '$lib/components/training-log/WorkoutInfoDialog.svelte';
	import type { Workout } from '$lib/db/types';
	import { formatDate } from '$lib/ui/formatDate';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import { Button } from '$lib/shadcn/button';
	import XIcon from '@lucide/svelte/icons/x';
	import { PAGE_tools_training_log } from '$lib/ROUTES';
	import WorkoutMenu from '$lib/components/training-log/WorkoutMenu.svelte';

	const {
		workout
	}: {
		workout: Workout;
	} = $props();

	let title = $derived(workout.title);
	let date = $derived(workout.date);
	let notes = $derived(workout.notes);
	let bodyweight = $derived(workout.bodyweight);
	let bodyweightUnit = $derived(workout.bodyweightUnit);
</script>

<header class="flex flex-col gap-4">
	<div class="flex items-center justify-between gap-4">
		<Button
			href={PAGE_tools_training_log}
			variant="outline"
			size="icon"
			aria-label="Back to training log"
		>
			<XIcon />
		</Button>
		<WorkoutMenu {workout} />
	</div>
	<div class="flex flex-col gap-2">
		<div class="flex items-start justify-between gap-4">
			<h1 class="text-2xl leading-6 font-semibold">{title}</h1>
			<WorkoutInfoDialog {workout}>
				{#snippet trigger({ props })}
					<Button {...props} size="icon" variant="ghost" class="shrink-0">
						<PencilIcon />
					</Button>
				{/snippet}
			</WorkoutInfoDialog>
		</div>
		<div class="flex shrink-0 flex-col items-start text-right">
			{#if date}
				<time class="text-muted-foreground text-sm" datetime={date.toISOString()}>
					{formatDate(date)}
				</time>
			{/if}
			{#if bodyweight}
				<p class="text-sm">
					<span class="font-semibold">Bodyweight:</span>
					{bodyweight}
					{bodyweightUnit ?? 'lbs'}
				</p>
			{/if}
		</div>
		<p class="text-sm">{notes}</p>
	</div>
</header>
