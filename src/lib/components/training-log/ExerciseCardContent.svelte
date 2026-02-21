<script lang="ts">
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import ExerciseSelection from './ExerciseSelection.svelte';
	import ExerciseInfoDialog from './ExerciseInfoDialog.svelte';
	import UnitSelector from '$lib/components/ui/UnitSelector.svelte';
	import ExerciseHistoryDialog from './ExerciseHistoryDialog.svelte';
	import * as Dialog from '$lib/shadcn/dialog';
	import { buttonVariants } from '$lib/shadcn/button';
	import Plus from '@lucide/svelte/icons/plus';
	import Pencil from '@lucide/svelte/icons/pencil';
	import OptimizedSetRow from './OptimizedSetRow.svelte';
	import { addExerciseToPerformanceGroup } from '$lib/training-log/addExerciseToPerformanceGroup';
	import Label from '$lib/shadcn/label/label.svelte';
	import Input from '$lib/shadcn/input/input.svelte';
	import Button from '$lib/shadcn/button/button.svelte';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import type { Exercise, PerformanceSet } from '$lib/db/types';

	type PerformanceWithRelations = {
		_id: Id<'performances'>;
		exerciseId: Id<'exercises'>;
		exercise: Exercise | null;
		weightUnit: 'lbs' | 'kg';
		groupOrder: number;
		sets: PerformanceSet[];
	};

	type PerformanceGroupWithRelations = {
		_id: Id<'performanceGroups'>;
		workoutId?: Id<'workouts'>;
		label?: string;
		performances?: PerformanceWithRelations[];
	};

	let {
		performanceGroup,
		performances
	}: {
		performanceGroup: PerformanceGroupWithRelations;
		performances: PerformanceWithRelations[];
	} = $props();

	const client = useConvexClient();
	const group = performanceGroup;

	const onExerciseAdded = async (exerciseId: Id<'exercises'>) => {
		const lastOrder = performances.at(-1)?.groupOrder ?? 0;
		await addExerciseToPerformanceGroup(client, group, exerciseId, lastOrder + 1);
	};

	const onLabelChange = async (event: Event) => {
		const value = (event.currentTarget as HTMLInputElement).value;
		await client.mutation(api.performanceGroups.update, {
			id: group._id,
			label: value
		});
	};

	const onDeletePerformance = async (performanceId: Id<'performances'>) => {
		await client.mutation(api.performances.remove, { id: performanceId });
		if (performances.length === 2) {
			await client.mutation(api.performanceGroups.update, {
				id: group._id,
				label: ''
			});
		}
	};
</script>

<div class="flex flex-col gap-4 p-4">
	<!-- Group label input for multi-exercise groups -->
	{#if performances.length > 1}
		<Label class="flex-1">
			<span class="sr-only">Group title</span>
			<Input
				type="text"
				placeholder={group.label ? '' : 'Group name (optional)'}
				value={group.label ?? ''}
				oninput={onLabelChange}
				class="text-sm font-medium"
			/>
		</Label>
	{/if}

	<!-- Exercise performances -->
	{#each performances as performance (performance._id)}
		<div class="flex flex-col gap-4">
			<!-- Exercise header -->
			<div class="flex items-center gap-2">
				<div class="flex min-w-0 flex-1 items-center gap-2">
					<ExerciseSelection
						onExerciseAdded={async (exerciseId) => {
							await client.mutation(api.performances.update, {
								id: performance._id,
								exerciseId
							});
						}}
					>
						{#snippet trigger()}
							<Dialog.Trigger
								class={buttonVariants({
									variant: 'ghost',
									class: 'h-auto min-w-0 flex-1 justify-start p-0 text-left hover:bg-transparent'
								})}
							>
								<span class="text-lg font-semibold whitespace-normal">
									{performance.exercise?.name ?? 'Select exercise'}
								</span>
							</Dialog.Trigger>
						{/snippet}
					</ExerciseSelection>
					{#if performance.exercise}
						<ExerciseInfoDialog exercise={performance.exercise}>
							{#snippet trigger()}
								<Dialog.Trigger
									class={buttonVariants({
										variant: 'ghost',
										size: 'icon',
										class: 'size-8 shrink-0'
									})}
									aria-label="Edit exercise details"
								>
									<Pencil class="size-4" />
								</Dialog.Trigger>
							{/snippet}
						</ExerciseInfoDialog>
					{/if}
				</div>
				<div class="flex items-center gap-2">
					{#if performance.exercise}
						<ExerciseHistoryDialog exerciseId={performance.exerciseId} />
					{/if}
					<UnitSelector
						value={performance.weightUnit}
						onValueChange={(unit) => {
							client.mutation(api.performances.update, {
								id: performance._id,
								weightUnit: unit
							});
						}}
					/>
					{#if performances.length > 1}
						<Button
							variant="ghost"
							size="icon"
							class="text-muted-foreground hover:text-destructive size-8"
							onclick={() => onDeletePerformance(performance._id)}
						>
							<Trash2 class="size-4" />
						</Button>
					{/if}
				</div>
			</div>

			<!-- Sets -->
			{#if performance.sets && performance.sets.length > 0}
				<div class="flex flex-col gap-2">
						{#each performance.sets as set, setIndex (set._id)}
							<OptimizedSetRow
								{set}
								{setIndex}
								unit={performance.weightUnit ?? 'lbs'}
								exercise={performance.exercise}
								previousSet={setIndex > 0 ? performance.sets[setIndex - 1] : null}
							/>
						{/each}
				</div>
			{/if}

			<!-- Add set button -->
			<Button
				variant="secondary"
				size="sm"
				class="w-full"
				onclick={() => {
					const lastSet = performance.sets?.at(-1);
					const order = lastSet ? lastSet.performanceOrder + 1 : 1;
					client.mutation(api.performanceSets.create, {
						performanceId: performance._id,
						performanceOrder: order
					});
				}}
			>
				<Plus class="mr-1 size-4" />
				Add set
			</Button>
		</div>
	{/each}

	<!-- Add exercise button -->
	<ExerciseSelection {onExerciseAdded}>
		{#snippet trigger()}
			<Dialog.Trigger class={buttonVariants({ variant: 'secondary', class: 'w-full' })}>
				<Plus class="mr-1 size-4" />
				Add exercise to group
			</Dialog.Trigger>
		{/snippet}
	</ExerciseSelection>
</div>
