<script lang="ts">
	import * as Dialog from '$lib/shadcn/dialog';
	import { type Snippet } from 'svelte';
	import { Input } from '$lib/shadcn/input';
	import { Textarea } from '$lib/shadcn/textarea';
	import DatePicker from '$lib/components/ui/DatePicker.svelte';
	import { CalendarDate, today } from '@internationalized/date';
	import { DEFAULT_WORKOUT_TITLE, TIMEZONE } from '$lib/constants';
	import Button from '$lib/shadcn/button/button.svelte';
	import { goto } from '$app/navigation';
	import Label from '$lib/shadcn/label/label.svelte';
	import UnitSelector from '$lib/components/ui/UnitSelector.svelte';
	import { resolve } from '$app/paths';
	import { api } from '$convex/_generated/api';
	import type { Doc } from '$convex/_generated/dataModel';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import PreviousWorkoutSelection from '$lib/components/training-log/PreviousWorkoutSelection.svelte';

	let {
		trigger,
		workout
	}: {
		workout?: Doc<'workouts'>;
		trigger: Snippet<[{ props: Record<string, unknown> }]>;
	} = $props();

	const client = useConvexClient();
	const previousWorkoutsQuery = useQuery(api.workouts.list, {});
	let previousWorkouts = $derived(previousWorkoutsQuery.data ?? []);
	let showPreviousWorkoutSelection = $derived(!workout && previousWorkouts.length);

	const dialogTitle = workout ? 'Edit workout' : 'Create workout';
	const buttonText = workout ? 'Save changes' : 'Create';
	const workoutDate = workout ? new Date(workout.date) : undefined;

	let open = $state(false);

	let templateWorkout = $state<Maybe<Doc<'workouts'>>>(null);
	let title = $derived(workout?.title ?? templateWorkout?.title);
	let notes = $state(workout?.notes);
	let date = $state(
		workoutDate
			? new CalendarDate(
					workoutDate.getFullYear(),
					workoutDate.getMonth() + 1,
					workoutDate.getDate()
				)
			: today(TIMEZONE)
	);
	let bodyweight = $state(workout?.bodyweight);
	let bodyweightUnit = $state(workout?.bodyweightUnit ?? 'lbs');

	const onSave = async (e: Event) => {
		e.preventDefault();
		if (workout) {
			await client.mutation(api.workouts.update, {
				id: workout._id,
				title: title ?? DEFAULT_WORKOUT_TITLE,
				notes: notes?.trim() ?? '',
				date: date.toDate(TIMEZONE).getTime(),
				bodyweight: bodyweight || 0,
				bodyweightUnit
			});
			open = false;
			return;
		}
		const newWorkoutId = await client.mutation(api.workouts.create, {
			title: title ?? DEFAULT_WORKOUT_TITLE,
			notes: notes?.trim() ?? '',
			date: date.toDate(TIMEZONE).getTime(),
			bodyweight:
				typeof bodyweight === 'number' && Number.isFinite(bodyweight) ? bodyweight : undefined,
			bodyweightUnit,
			templateWorkoutId: templateWorkout?._id
		});
		goto(resolve('/(app)/tools/training-log/workout-[id]', { id: newWorkoutId }));
	};
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger>
		{#snippet child({ props })}
			{@render trigger({ props })}
		{/snippet}
	</Dialog.Trigger>
	<Dialog.Content class="p-5">
		<Dialog.Title class="text-left">{dialogTitle}</Dialog.Title>
		<form class="flex flex-col gap-4" onsubmit={onSave}>
			{#if showPreviousWorkoutSelection}
				<PreviousWorkoutSelection
					workouts={previousWorkouts}
					bind:selectedWorkout={templateWorkout}
				/>
			{/if}
			<Label class="flex flex-col gap-2">
				Workout name
				<Input type="text" bind:value={title} />
			</Label>
			<Label class="flex flex-col gap-2">
				Date
				<DatePicker bind:value={date} />
			</Label>
			<div class="flex items-end gap-2">
				<Label class="flex flex-col gap-2">
					Bodyweight
					<Input type="number" min="0" step="0.1" bind:value={bodyweight} />
				</Label>
				<UnitSelector bind:value={bodyweightUnit} />
			</div>
			<Label class="flex flex-col gap-2">
				Notes
				<Textarea placeholder="Workout notes..." bind:value={notes} rows={2} class="font-normal" />
			</Label>
			<Dialog.Footer>
				<Button type="submit">{buttonText}</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
