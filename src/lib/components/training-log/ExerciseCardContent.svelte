<script lang="ts">
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import ExerciseSelection from './ExerciseSelection.svelte';
	import * as Dialog from '$lib/shadcn/dialog';
	import { buttonVariants } from '$lib/shadcn/button';
	import Plus from '@lucide/svelte/icons/plus';
	import ExerciseSetRow from './ExerciseSetRow.svelte';
	import ExerciseCardExerciseRow from './ExerciseCardExerciseRow.svelte';
	import { addExerciseToPerformanceGroup } from '$lib/training-log/addExerciseToPerformanceGroup';
	import Label from '$lib/shadcn/label/label.svelte';
	import Input from '$lib/shadcn/input/input.svelte';
	import Button from '$lib/shadcn/button/button.svelte';
	import type { PerformanceWithRelations } from '$lib/db/types';
	import ExerciseCardTargetSummary from '$lib/components/training-log/ExerciseCardTargetSummary.svelte';

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
			<ExerciseCardExerciseRow
				{performance}
				showDeleteButton={performances.length > 1}
				onDelete={onDeletePerformance}
			/>
			<ExerciseCardTargetSummary {performance} />

			<!-- Sets -->
			{#if performance.sets && performance.sets.length > 0}
				<div class="flex flex-col gap-2">
					{#each performance.sets as set, setIndex (set._id)}
						<ExerciseSetRow
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
