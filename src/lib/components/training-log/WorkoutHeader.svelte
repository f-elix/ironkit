<script lang="ts">
	import WorkoutInfoDialog from '$lib/components/training-log/WorkoutInfoDialog.svelte';
	import type { Workout } from '$lib/db/types';
	import { formatDate } from '$lib/ui/formatDate';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import { Button } from '$lib/shadcn/button';
	import { resolve } from '$app/paths';
	import WorkoutMenu from '$lib/components/training-log/WorkoutMenu.svelte';

	const {
		workout
	}: {
		workout: Workout;
	} = $props();

	let title = $derived(workout.title);
	let date = $derived(workout.date ? new Date(workout.date) : undefined);
	let notes = $derived(workout.notes);
	let bodyweight = $derived(workout.bodyweight);
	let bodyweightUnit = $derived(workout.bodyweightUnit);
</script>

<!-- Compact workout header with back button -->
<header class="flex items-center gap-3">
	<!-- Back button (mobile only - desktop uses sidebar navigation) -->
	<Button
		variant="ghost"
		size="icon"
		href={resolve('/(app)/tools/training-log')}
		aria-label="Back to workouts"
		class="shrink-0 md:hidden"
	>
		<ArrowLeftIcon class="size-5" />
	</Button>

	<div class="flex min-w-0 flex-1 flex-col">
		<div class="flex items-center gap-2">
			<h1 class="truncate text-lg font-semibold">{title}</h1>
			<WorkoutInfoDialog {workout}>
				{#snippet trigger({ props })}
					<Button {...props} size="icon" variant="ghost" class="size-7 shrink-0">
						<PencilIcon class="size-3.5" />
					</Button>
				{/snippet}
			</WorkoutInfoDialog>
		</div>
		<div class="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
			{#if date}
				<time datetime={date.toISOString()}>{formatDate(date)}</time>
			{/if}
			{#if bodyweight}
				<span>{bodyweight} {bodyweightUnit ?? 'lbs'}</span>
			{/if}
		</div>
		{#if notes}
			<p class="text-muted-foreground mt-1 text-xs">{notes}</p>
		{/if}
	</div>
	<WorkoutMenu {workout} />
</header>
