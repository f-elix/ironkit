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
	import { muscleGroups as muscleGroupsList } from '$lib/data/muscleGroups';
	import Badge from '$lib/shadcn/badge/badge.svelte';
	import ExerciseHistoryDialog from '$lib/components/training-log/ExerciseHistoryDialog.svelte';
	const allExercisesQuery = useQuery(triplit, triplit.query('exercises').Order('name', 'ASC'));

	let allExercises = $derived(allExercisesQuery.results);

	let search = $state('');

	let filteredExercises = $derived(
		allExercises
			?.map((exercise) => {
				const muscleGroups = Array.from(exercise.muscleGroups);
				const score = computeCommandScore(exercise.name, search, [
					...muscleGroups,
					exercise.loadType,
					exercise.executionType
				]);
				return { ...exercise, score };
			})
			.filter((exercise) => exercise.score > 0)
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
						{@const targetMuscleGroups = Array.from(exercise.muscleGroups)}
						{@const loadType = exercise.loadType}
						{@const executionType = exercise.executionType}
						<li class="bg-muted/30 gap-4 rounded-md border p-4">
							<article class="flex flex-col gap-1">
								<div class="flex justify-between gap-4">
									<h3 class="text-lg leading-6 font-bold">{name}</h3>
									<DeleteExerciseDialog {exercise} />
								</div>
								<div class="flex items-end justify-between gap-4">
									<div class="flex flex-col gap-1">
										<p class="text-muted-foreground flex flex-col text-sm">
											<span>For {executionType}</span>
											<span class="capitalize">{loadType}</span>
										</p>
										<ul class="text-muted-foreground mt-2 flex flex-wrap gap-2 text-sm">
											{#each targetMuscleGroups as muscleGroup}
												{@const muscleGroupName = muscleGroupsList.find(
													(mg) => mg.id === muscleGroup
												)?.name}
												{#if muscleGroupName}
													<li>
														<Badge variant="outline">
															{muscleGroupName}
														</Badge>
													</li>
												{/if}
											{/each}
										</ul>
									</div>
									<div class="flex gap-1">
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
										<ExerciseHistoryDialog exerciseId={exercise.id} />
									</div>
								</div>
							</article>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="text-muted-foreground text-center text-sm">No exercises found</p>
			{/if}
		</div>
		<div class="bg-background sticky bottom-0 mt-auto flex flex-col p-4 pb-4">
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
