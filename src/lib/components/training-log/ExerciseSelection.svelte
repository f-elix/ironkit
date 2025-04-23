<script lang="ts">
	import * as Command from '$lib/shadcn/command';
	import * as Dialog from '$lib/shadcn/dialog';
	import { triplit } from '$lib/db/triplit';
	import { useQuery } from '@triplit/svelte';
	import ExerciseCreationDialog from '$lib/components/training-log/ExerciseCreationDialog.svelte';
	import Button from '$lib/shadcn/button/button.svelte';
	import CirclePlus from '@lucide/svelte/icons/circle-plus';
	import { addExerciseToWorkout } from '$lib/training-log/addExerciseToWorkout';
	import type { PerformanceGroup, Performance, PerformanceSet } from '$lib/db/types';

	let {
		workoutId,
		lastOrder,
		onExerciseAdded
	}: {
		workoutId: string;
		lastOrder: number;
		onExerciseAdded?: (data: {
			performanceGroup: PerformanceGroup;
			performance: Performance;
			performanceSet: PerformanceSet;
		}) => void;
	} = $props();

	const exercisesQuery = useQuery(triplit, triplit.query('exercises'));

	let exercises = $derived(exercisesQuery.results ?? []);
	let value = $state('');
	let open = $state(false);

	const onExerciseSelected = async (exerciseId: string) => {
		const result = await addExerciseToWorkout(workoutId, exerciseId, lastOrder + 1);
		open = false;
		onExerciseAdded?.(result);
	};
</script>

{#if exercises.length}
	<Dialog.Root bind:open>
		<Dialog.Trigger>
			{#snippet child({ props })}
				<Button
					variant="default"
					class="w-full justify-center"
					{...props}
					role="combobox"
					aria-expanded={open}
				>
					Add exercise
					<CirclePlus />
				</Button>
			{/snippet}
		</Dialog.Trigger>
		<Dialog.Content class="w-[90vw]">
			<Command.Root>
				<Command.Input placeholder="Search exercises" bind:value />
				<Command.List>
					<Command.Empty class="flex w-full flex-col gap-6 pb-1">
						<p class="text-sm text-muted-foreground">No exercises found</p>
						<ExerciseCreationDialog name={value} />
					</Command.Empty>
					<Command.Group>
						{#each exercises as exercise (exercise.id)}
							<Command.Item
								class="text-lg"
								keywords={[exercise.name, ...exercise.muscleGroups, exercise.loadType]}
								onSelect={() => {
									onExerciseSelected(exercise.id);
								}}
							>
								{exercise.name}
							</Command.Item>
						{/each}
					</Command.Group>
					<Command.Group class="px-0 pt-0">
						<Command.Separator class="mb-3 mt-2" />
						<ExerciseCreationDialog
							onCreated={(newExercise) => {
								onExerciseSelected(newExercise.id);
								open = false;
							}}
						/>
					</Command.Group>
				</Command.List>
			</Command.Root>
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<div class="flex flex-col gap-2">
		<p class="text-center font-medium text-muted-foreground">
			Create your first exercise to get started.
		</p>
		<ExerciseCreationDialog />
	</div>
{/if}
