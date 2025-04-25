<script lang="ts">
	import * as Command from '$lib/shadcn/command';
	import * as Dialog from '$lib/shadcn/dialog';
	import { triplit } from '$lib/db/triplit';
	import { useQuery } from '@triplit/svelte';
	import ExerciseCreationDialog from '$lib/components/training-log/ExerciseCreationDialog.svelte';
	import type { Snippet } from 'svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';

	let {
		onExerciseAdded,
		trigger
	}: {
		onExerciseAdded?: (exerciseId: string) => Promise<void> | void;
		trigger?: Snippet;
	} = $props();

	const exercisesQuery = useQuery(triplit, triplit.query('exercises'));

	let exercises = $derived(exercisesQuery.results ?? []);
	let value = $state('');
	let open = $state(false);

	const onExerciseSelected = async (exerciseId: string) => {
		await onExerciseAdded?.(exerciseId);
		open = false;
	};
</script>

{#if exercises.length}
	<Dialog.Root bind:open>
		{@render trigger?.()}
		<Dialog.Content class="w-[90vw] max-w-2xl">
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
							onExerciseCreated={(newExercise) => {
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
	<EmptyState title="No exercises yet">
		{#snippet description()}
			Create your first<br />exercise to get started.
		{/snippet}
		{#snippet button()}
			<ExerciseCreationDialog
				onExerciseCreated={(newExercise) => {
					onExerciseSelected(newExercise.id);
				}}
			/>
		{/snippet}
	</EmptyState>
{/if}
