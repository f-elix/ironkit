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
	import PreviousWorkoutSelection from '$lib/components/training-log/PreviousWorkoutSelection.svelte';
	import type { Workout as WorkoutType } from '$lib/jazz/types';
	import { AccountCoState } from 'jazz-tools/svelte';
	import { IronkitAccount, Workout } from '$lib/jazz/schema';
	import { createWorkoutFromTemplate } from '$lib/jazz/workout';

	let {
		trigger,
		workout
	}: {
		workout?: WorkoutType;
		trigger: Snippet<[{ props: Record<string, unknown> }]>;
	} = $props();

	const account = new AccountCoState(IronkitAccount, {
		resolve: {
			root: {
				workouts: {
					$each: true
				}
			}
		}
	});

	const root = $derived(account.current.$isLoaded ? account.current.root : null);
	const previousWorkouts = $derived(root?.workouts?.filter((w) => w.$isLoaded) ?? []);
	const showPreviousWorkoutSelection = $derived(!workout && previousWorkouts.length);

	const dialogTitle = $derived(workout ? 'Edit workout' : 'Create workout');
	const buttonText = $derived(workout ? 'Save changes' : 'Create');
	const workoutDate = $derived(workout ? new Date(workout.date) : undefined);

	let open = $state(false);

	let templateWorkout = $state<WorkoutType>();
	let title = $derived(workout?.title ?? templateWorkout?.title);
	let notes = $derived(workout?.notes);
	let date = $derived(
		workoutDate
			? new CalendarDate(
					workoutDate.getFullYear(),
					workoutDate.getMonth() + 1,
					workoutDate.getDate()
				)
			: today(TIMEZONE)
	);
	let bodyweight = $derived(workout?.bodyweight);
	let bodyweightUnit = $derived(workout?.bodyweightUnit ?? 'lbs');

	const onSave = async (e: Event) => {
		if (!root) {
			return;
		}
		e.preventDefault();
		if (workout) {
			workout.$jazz.set('title', title ?? DEFAULT_WORKOUT_TITLE);
			workout.$jazz.set('notes', notes?.trim() ?? '');
			workout.$jazz.set('date', date.toDate(TIMEZONE));
			workout.$jazz.set('bodyweight', bodyweight || undefined);
			workout.$jazz.set('bodyweightUnit', bodyweightUnit);
			open = false;
			return;
		}
		const newWorkout = templateWorkout
			? await createWorkoutFromTemplate(templateWorkout.$jazz.id)
			: Workout.create({
					title: title ?? DEFAULT_WORKOUT_TITLE,
					notes: notes?.trim() ?? '',
					date: date.toDate(TIMEZONE),
					bodyweight: bodyweight || undefined,
					bodyweightUnit,
					performanceGroups: []
				});
		root.workouts.$jazz.push(newWorkout);
		await goto(resolve('/(app)/tools/training-log/workout-[id]', { id: newWorkout.$jazz.id }));
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
