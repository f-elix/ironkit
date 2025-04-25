<script lang="ts">
	import type { Workout } from '$lib/db/types';
	import * as Dialog from '$lib/shadcn/dialog';
	import type { Snippet } from 'svelte';
	import { Input } from '$lib/shadcn/input';
	import { Textarea } from '$lib/shadcn/textarea';
	import DatePicker from '$lib/components/ui/DatePicker.svelte';
	import { CalendarDate, today } from '@internationalized/date';
	import { TIMEZONE } from '$lib/constants';
	import Button from '$lib/shadcn/button/button.svelte';
	import { triplit } from '$lib/db/triplit';
	import { userId } from '$lib/db/userId';
	import { goto } from '$app/navigation';
	import { PAGE_tools_training_log_workout_id } from '$lib/ROUTES';
	import Label from '$lib/shadcn/label/label.svelte';
	import PreviousWorkoutSelection from '$lib/components/training-log/PreviousWorkoutSelection.svelte';

	let {
		trigger,
		workout
	}: {
		workout?: Workout;
		trigger: Snippet<[{ props: Record<string, unknown> }]>;
	} = $props();

	const dialogTitle = workout ? 'Edit workout' : 'Create workout';
	const buttonText = workout ? 'Save changes' : 'Create';
	const workoutDate = workout?.date;

	let open = $state(false);

	let templateWorkout = $state<Maybe<Workout>>(null);
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

	const onSave = async (e: Event) => {
		e.preventDefault();
		if (workout) {
			triplit.update('workouts', workout.id, {
				title,
				notes: notes?.trim() ?? null,
				date: date.toDate(TIMEZONE)
			});
			open = false;
			return;
		}

		const newWorkout = await triplit.transact(async (tx) => {
			const newWorkout = await tx.insert('workouts', {
				userId: userId(),
				title,
				notes: notes?.trim() ?? null,
				date: date.toDate(TIMEZONE)
			});
			if (templateWorkout) {
				const peformanceGroups = await tx.fetch(
					triplit
						.query('performanceGroups')
						.Where('workoutId', '=', templateWorkout.id)
						.Include('performances', (rel) => {
							return rel('performances').Include('sets');
						})
				);
				for (const templatePerformanceGroup of peformanceGroups) {
					const newGroup = await tx.insert('performanceGroups', {
						userId: templatePerformanceGroup.userId,
						workoutId: newWorkout.id,
						workoutOrder: templatePerformanceGroup.workoutOrder
					});
					for (const templatePerformance of templatePerformanceGroup.performances) {
						const newPerformance = await tx.insert('performances', {
							userId: templatePerformance.userId,
							performanceGroupId: newGroup.id,
							exerciseId: templatePerformance.exerciseId,
							groupOrder: templatePerformance.groupOrder,
							workoutId: newWorkout.id
						});
						for (const templateSet of templatePerformance.sets) {
							await tx.insert('performanceSets', {
								userId: templateSet.userId,
								performanceId: newPerformance.id,
								performanceOrder: templateSet.performanceOrder
							});
						}
					}
				}
			}
			return newWorkout;
		});
		goto(PAGE_tools_training_log_workout_id({ id: newWorkout.id }));
	};
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger>
		{#snippet child({ props })}
			{@render trigger({ props })}
		{/snippet}
	</Dialog.Trigger>
	<Dialog.Content class="w-[90vw] max-w-2xl">
		<Dialog.Title class="text-left">{dialogTitle}</Dialog.Title>
		<form class="flex flex-col gap-4" onsubmit={onSave}>
			{#if !workout}
				<PreviousWorkoutSelection bind:selectedWorkout={templateWorkout} />
			{/if}
			<Label class="flex flex-col gap-2">
				Name
				<Input type="text" placeholder="Workout name" bind:value={title} />
			</Label>
			<Label class="flex flex-col gap-2">
				Date
				<DatePicker bind:value={date} />
			</Label>
			<Label class="flex flex-col gap-2">
				Notes
				<Textarea placeholder="Workout notes" bind:value={notes} rows={5} class="font-normal" />
			</Label>
			<Dialog.Footer>
				<Button type="submit">{buttonText}</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
