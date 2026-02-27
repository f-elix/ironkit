<script lang="ts">
	import * as Command from '$lib/shadcn/command';
	import * as Dialog from '$lib/shadcn/dialog';
	import ExerciseInfoDialog from '$lib/components/training-log/ExerciseInfoDialog.svelte';
	import type { Snippet } from 'svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Separator from '$lib/shadcn/separator/separator.svelte';
	import { Account } from '$lib/jazz/schema';
	import { AccountCoState } from 'jazz-tools/svelte';
	import type { Exercise } from '$lib/jazz/types';

	let {
		onExerciseAdded,
		trigger
	}: {
		onExerciseAdded?: (exercise: Exercise) => void;
		trigger?: Snippet;
	} = $props();

	const account = new AccountCoState(Account, {
		resolve: {
			root: {
				exercises: { $each: true }
			}
		}
	});

	const root = $derived(account.current.$isLoaded ? account.current.root : null);
	const exercises = $derived(root?.exercises ?? []);

	let value = $state('');
	let open = $state(false);

	const onExerciseSelected = async (exerciseId: string) => {
		const exercise = exercises.find((e) => e.$jazz.id === exerciseId);
		if (exercise) {
			onExerciseAdded?.(exercise);
		}
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
							onExerciseCreated={(newExerciseId) => {
								onExerciseSelected(newExerciseId);
								open = false;
							}}
						/>
					</Command.Empty>
					<Command.Group class="pt-2">
						<ExerciseInfoDialog
							name={value}
							triggerSize="sm"
							onExerciseCreated={(newExerciseId) => {
								onExerciseSelected(newExerciseId);
								open = false;
							}}
						/>
						<Separator class="my-2" />
						{#each exercises as exercise (exercise.$jazz.id)}
							<Command.Item
								class="text-lg"
								value={exercise.name.toLowerCase()}
								keywords={[...exercise.muscleGroups, exercise.loadType, exercise.executionType]}
								onSelect={() => {
									onExerciseSelected(exercise.$jazz.id);
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
{:else if root}
	<EmptyState title="No exercises yet">
		{#snippet description()}
			Create your first<br />exercise to get started.
		{/snippet}
		{#snippet button()}
			<ExerciseInfoDialog
				onExerciseCreated={(newExerciseId) => {
					onExerciseSelected(newExerciseId);
				}}
			/>
		{/snippet}
	</EmptyState>
{/if}
