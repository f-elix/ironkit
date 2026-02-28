<script lang="ts">
	import ExerciseInfoDialog from '$lib/components/training-log/ExerciseInfoDialog.svelte';
	import { computeCommandScore, Dialog } from 'bits-ui';
	import { buttonVariants } from '$lib/shadcn/button';
	import Button from '$lib/shadcn/button/button.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { Trigger } from '$lib/shadcn/dialog';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import EditIcon from '@lucide/svelte/icons/pencil';
	import DeleteExerciseDialog from '$lib/components/training-log/DeleteExerciseDialog.svelte';
	import Label from '$lib/shadcn/label/label.svelte';
	import Input from '$lib/shadcn/input/input.svelte';
	import { muscleGroups as muscleGroupsList } from '$lib/data/muscleGroups';
	import Badge from '$lib/shadcn/badge/badge.svelte';
	import ExerciseHistoryDialog from '$lib/components/training-log/ExerciseHistoryDialog.svelte';
	import { IronkitAccount } from '$lib/jazz/schema';
	import { AccountCoState } from 'jazz-tools/svelte';

	const account = new AccountCoState(IronkitAccount, {
		resolve: {
			root: {
				exercises: { $each: true }
			}
		}
	});

	const root = $derived(account.current.$isLoaded ? account.current.root : null);

	let allExercises = $derived(root?.exercises ?? []);

	let search = $state('');

	let exercises = $derived.by(() => {
		if (!allExercises) {
			return [];
		}
		if (!search) {
			return allExercises.map((exercise) => ({ exercise, score: 0 }));
		}
		return allExercises
			.map((exercise) => {
				const muscleGroups = Array.from(exercise.muscleGroups);
				const score = computeCommandScore(exercise.name, search, [
					...muscleGroups,
					exercise.loadType,
					exercise.executionType
				]);
				return { exercise, score };
			})
			.filter((item) => item.score > 0)
			.toSorted((a, b) => b.score - a.score);
	});
</script>

<div class="flex grow flex-col p-4 md:p-0">
	{#if !root}
		<div class="flex grow flex-col items-center pt-10">Loading...</div>
	{:else if allExercises?.length}
		<div class="flex flex-col gap-4">
			<Label>
				<span class="sr-only">Search exercises</span>
				<Input placeholder="Search exercises" bind:value={search} />
			</Label>
			{#if exercises?.length}
				<ul class="grid gap-4 pb-20 md:grid-cols-2 md:pb-4 lg:grid-cols-3">
					{#each exercises as item (item.exercise.$jazz.id)}
						{@const exercise = item.exercise}
						{@const name = exercise.name}
						{@const targetMuscleGroups = Array.from(exercise.muscleGroups)}
						{@const loadType = exercise.loadType}
						{@const executionType = exercise.executionType}
						<li class="bg-card gap-4 rounded-lg border p-4 shadow-sm">
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
										<ExerciseHistoryDialog exerciseId={exercise.$jazz.id} />
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
		<!-- Desktop: Inline create button -->
		<div class="mt-auto hidden pt-4 md:block">
			<ExerciseInfoDialog>
				{#snippet trigger()}
					<Trigger class={buttonVariants({ size: 'lg', class: 'w-full' })}>
						<PlusIcon />
						Create exercise
					</Trigger>
				{/snippet}
			</ExerciseInfoDialog>
		</div>

		<!-- Mobile: Floating Action Button -->
		<div class="fixed right-4 bottom-16 z-50 md:hidden">
			<ExerciseInfoDialog>
				{#snippet trigger()}
					<Dialog.Trigger>
						{#snippet child({ props })}
							<Button
								{...props}
								size="icon"
								class="bg-primary text-primary-foreground hover:bg-primary/90 size-14 rounded-full shadow-lg"
								aria-label="Create exercise"
							>
								<PlusIcon class="size-7" />
							</Button>
						{/snippet}
					</Dialog.Trigger>
				{/snippet}
			</ExerciseInfoDialog>
		</div>
	{:else}
		<div class="grow pb-4">
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
