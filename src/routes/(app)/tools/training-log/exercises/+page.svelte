<script lang="ts">
	import { triplit } from '$lib/db/triplit';
	import { useQuery } from '@triplit/svelte';
	import ExerciseInfoDialog from '$lib/components/training-log/ExerciseInfoDialog.svelte';
	import { computeCommandScore, Dialog } from 'bits-ui';
	import { buttonVariants } from '$lib/shadcn/button';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { Trigger } from '$lib/shadcn/dialog';
	import PlusIcon from '@lucide/svelte/icons/file-plus';
	import EditIcon from '@lucide/svelte/icons/pencil';
	import DeleteExerciseDialog from '$lib/components/training-log/DeleteExerciseDialog.svelte';
	import Label from '$lib/shadcn/label/label.svelte';
	import Input from '$lib/shadcn/input/input.svelte';

	const allExercisesQuery = useQuery(triplit, triplit.query('exercises').Order('name', 'ASC'));

	let allExercises = $derived(allExercisesQuery.results);

	let search = $state('');

	let filteredExercises = $derived(
		allExercises
			?.map((exercise) => {
				const muscleGroups = Array.from(exercise.muscleGroups);
				const score = computeCommandScore(exercise.name, search, muscleGroups);
				return { ...exercise, score };
			})
			.filter((exercise) => exercise.score > 0.1)
			.toSorted((a, b) => b.score - a.score)
	);

	let exercises = $derived(search ? (filteredExercises ?? []) : (allExercises ?? []));
</script>

<div class="flex grow flex-col gap-4">
	{#if allExercises?.length}
		<div class="flex flex-col gap-8 px-4">
			<Label>
				<span class="sr-only">Search exercises</span>
				<Input placeholder="Search exercises" bind:value={search} />
			</Label>
			{#if exercises?.length}
				<ul class="flex flex-col gap-4">
					{#each exercises as exercise (exercise.id)}
						{@const name = exercise.name}
						<li class="flex items-center justify-between gap-4 rounded-md border bg-muted/30 p-4">
							<span class="text-lg font-bold">{name}</span>
							<div class="flex gap-2">
								<DeleteExerciseDialog {exercise} />
								<ExerciseInfoDialog {exercise}>
									{#snippet trigger()}
										<Dialog.Trigger
											class={buttonVariants({
												variant: 'secondary',
												size: 'icon'
											})}
											aria-label="Edit {name}"
										>
											<EditIcon />
										</Dialog.Trigger>
									{/snippet}
								</ExerciseInfoDialog>
							</div>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="text-center text-sm text-muted-foreground">No exercises found</p>
			{/if}
		</div>
		<div class="sticky bottom-0 mt-auto flex flex-col bg-background p-4 pb-4">
			<ExerciseInfoDialog>
				{#snippet trigger()}
					<Trigger class={buttonVariants({ size: 'lg' })}>
						<PlusIcon />
						Create exercise
					</Trigger>
				{/snippet}
			</ExerciseInfoDialog>
		</div>
	{:else}
		<div class="grow px-4 pb-4">
			<EmptyState title="No exercises yet">
				{#snippet description()}
					Create your first<br />exercise to get started.
				{/snippet}
				{#snippet button()}
					<ExerciseInfoDialog>
						{#snippet trigger()}
							<Trigger class={buttonVariants({ size: 'lg' })}>
								<PlusIcon />
								Create exercise
							</Trigger>
						{/snippet}
					</ExerciseInfoDialog>
				{/snippet}
			</EmptyState>
		</div>
	{/if}
</div>
