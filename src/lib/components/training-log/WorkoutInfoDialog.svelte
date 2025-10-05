<script lang="ts">
	import type { Workout } from '$lib/db/types';
	import * as Dialog from '$lib/shadcn/dialog';
	import { type Snippet } from 'svelte';
	import { Input } from '$lib/shadcn/input';
	import { Textarea } from '$lib/shadcn/textarea';
	import DatePicker from '$lib/components/ui/DatePicker.svelte';
	import { CalendarDate, today } from '@internationalized/date';
	import { DEFAULT_WORKOUT_TITLE, TIMEZONE } from '$lib/constants';
	import Button from '$lib/shadcn/button/button.svelte';
	import { triplit } from '$lib/db/triplit';
	import { userId } from '$lib/db/userId';
	import { goto } from '$app/navigation';
	import Label from '$lib/shadcn/label/label.svelte';
	import PreviousWorkoutSelection from '$lib/components/training-log/PreviousWorkoutSelection.svelte';
	import UnitSelector from '$lib/components/ui/UnitSelector.svelte';
	import { useQuery } from '@triplit/svelte';
	import { defaultInteractiveWidget } from '$lib/defaultInteractiveWidget';
	import { resolve } from '$app/paths';

	let {
		trigger,
		workout
	}: {
		workout?: Workout;
		trigger: Snippet<[{ props: Record<string, unknown> }]>;
	} = $props();

	const previousWorkoutsQuery = useQuery(triplit, triplit.query('workouts').Order('date', 'DESC'));
	let previousWorkouts = $derived(previousWorkoutsQuery.results ?? []);
	let showPreviousWorkoutSelection = $derived(!workout && previousWorkouts.length);

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
	let bodyweight = $state(workout?.bodyweight);
	let bodyweightUnit = $state(workout?.bodyweightUnit ?? 'lbs');

	const onSave = async (e: Event) => {
		e.preventDefault();
		if (workout) {
			triplit.update('workouts', workout.id, {
				title: title ?? DEFAULT_WORKOUT_TITLE,
				notes: notes?.trim() ?? null,
				date: date.toDate(TIMEZONE),
				bodyweight,
				bodyweightUnit
			});
			open = false;
			return;
		}

		const newWorkout = await triplit.transact(async (tx) => {
			const newWorkout = await tx.insert('workouts', {
				userId: userId(),
				title: title ?? DEFAULT_WORKOUT_TITLE,
				notes: notes?.trim() ?? null,
				date: date.toDate(TIMEZONE),
				bodyweight,
				bodyweightUnit
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
						label: templatePerformanceGroup.label,
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
		goto(resolve('/(app)/tools/training-log/workout-[id]', { id: newWorkout.id }));
	};

	let resetInteractiveWidget: (() => void) | undefined;
</script>

<Dialog.Root
	bind:open
	onOpenChange={(isOpen) => {
		if (isOpen) {
			resetInteractiveWidget = defaultInteractiveWidget();
		} else {
			resetInteractiveWidget?.();
		}
	}}
>
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
