<script lang="ts">
	import * as Command from '$lib/shadcn/command';
	import * as Dialog from '$lib/shadcn/dialog';
	import { api } from '$convex/_generated/api';
	import { useQuery } from 'convex-svelte';
	import ExerciseInfoDialog from '$lib/components/training-log/ExerciseInfoDialog.svelte';
	import type { Snippet } from 'svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Separator from '$lib/shadcn/separator/separator.svelte';

	let {
		onExerciseAdded,
		trigger
	}: {
		onExerciseAdded?: (exerciseId: string) => Promise<void> | void;
		trigger?: Snippet;
	} = $props();

	const exercisesQuery = useQuery(api.exercises.list, {});

	let exercises = $derived(exercisesQuery.data ?? []);
	let value = $state('');
	let open = $state(false);

	const onExerciseSelected = async (exerciseId: string) => {
		await onExerciseAdded?.(exerciseId);
		open = false;
		value = '';
	};
</script>

{#if exercises.length}
	<Dialog.Root bind:open>
		{@render trigger?.()}
		<Dialog.Content class="p-4">
			<Command.Root class="bg-transparent">
				<Command.Input placeholder="Search exercises" bind:value />
				<Command.List>
					<Command.Empty class="flex w-full flex-col gap-6 pb-1">
						<p class="text-muted-foreground text-sm">No exercises found</p>
						<ExerciseInfoDialog
							name={value}
							onExerciseCreated={(newExercise) => {
								onExerciseSelected(newExercise.id);
								open = false;
							}}
						/>
					</Command.Empty>
					<Command.Group class="pt-2">
						<ExerciseInfoDialog
							name={value}
							triggerSize="sm"
							onExerciseCreated={(newExercise) => {
								onExerciseSelected(newExercise.id);
								open = false;
							}}
						/>
						<Separator class="my-2" />
						{#each exercises as exercise (exercise._id)}
							<Command.Item
								class="text-lg"
								value={exercise.name.toLowerCase()}
								keywords={[...exercise.muscleGroups, exercise.loadType, exercise.executionType]}
								onSelect={() => {
									onExerciseSelected(exercise._id);
								}}
							>
								{exercise.name}
							</Command.Item>
						{/each}
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
			<ExerciseInfoDialog
				onExerciseCreated={(newExercise) => {
					onExerciseSelected(newExercise.id);
				}}
			/>
		{/snippet}
	</EmptyState>
{/if}
