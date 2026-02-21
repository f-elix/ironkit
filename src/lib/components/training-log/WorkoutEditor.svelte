<script lang="ts">
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import ExerciseSelection from '$lib/components/training-log/ExerciseSelection.svelte';
	import * as Dialog from '$lib/shadcn/dialog';
	import Button from '$lib/shadcn/button/button.svelte';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { addExerciseToWorkout } from '$lib/training-log/addExerciseToWorkout';
	import { DragDropProvider, type DragDropEvents } from '@dnd-kit-svelte/svelte';
	import { move } from '@dnd-kit/helpers';
	import SortableExerciseCard from '$lib/components/training-log/SortableExerciseCard.svelte';
	import type { Id } from '$convex/_generated/dataModel';
	import { cn } from '$lib/shadcn/utils';
	import WorkoutStats from '$lib/components/training-log/WorkoutStats.svelte';
	import WorkoutInfoDialog from '$lib/components/training-log/WorkoutInfoDialog.svelte';
	import type { Workout } from '$lib/db/types';

	let { workoutId, workout }: { workoutId: Id<'workouts'>; workout: Workout } = $props();

	const client = useConvexClient();
	const groupsQuery = useQuery(api.performanceGroups.list, { workoutId });

	let performanceGroups = $derived(groupsQuery.data ?? []);
	let lastOrder = $derived(performanceGroups?.at(-1)?.workoutOrder ?? 0);
	let dragSnapshot = $state<typeof performanceGroups | null>(null);

	// Using a simple array to track expanded state - reactive via $state
	let expandedGroupIds = $state<string[]>([]);

	let allExpanded = $derived(
		performanceGroups.length === 0 ||
			(performanceGroups.length > 0 &&
				performanceGroups.every((g) => expandedGroupIds.includes(g._id)))
	);

	const toggleExpand = (groupId: string) => {
		if (expandedGroupIds.includes(groupId)) {
			expandedGroupIds = expandedGroupIds.filter((id) => id !== groupId);
		} else {
			expandedGroupIds = [...expandedGroupIds, groupId];
		}
	};

	const expandAll = () => {
		expandedGroupIds = performanceGroups.map((g) => g._id);
	};

	const collapseAll = () => {
		expandedGroupIds = [];
	};

	const onExerciseAdded = async (exerciseId: Id<'exercises'>) => {
		const result = await addExerciseToWorkout(client, workoutId, exerciseId, lastOrder + 1);
		expandedGroupIds = [...expandedGroupIds, result.performanceGroupId];
	};

	const onDragStart: DragDropEvents['dragstart'] = () => {
		dragSnapshot = performanceGroups.map((pg) => ({
			...pg,
			id: pg._id
		}));
	};

	const onDragEnd: DragDropEvents['dragend'] = async (event) => {
		if (!dragSnapshot) {
			return;
		}

		const reorderedGroups = move(
			dragSnapshot.map((item) => ({
				...item,
				id: item._id
			})),
			event as unknown as Parameters<typeof move>[1]
		);

		await client.mutation(api.performanceGroups.updateOrder, {
			updates: reorderedGroups.map((item, index) => ({
				id: item._id,
				workoutOrder: index
			}))
		});

		dragSnapshot = null;
	};
</script>

<div class="flex min-h-full flex-col">
	<WorkoutInfoDialog {workout}>
		{#snippet trigger({ props })}
			<WorkoutStats {workout} {...props} />
		{/snippet}
	</WorkoutInfoDialog>

	<div class="flex items-center justify-between px-4 py-2">
		<div class="flex items-center gap-2">
			<button
				class={cn(
					'rounded px-2 py-1 text-xs font-medium transition-colors',
					allExpanded ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
				)}
				onclick={allExpanded ? collapseAll : expandAll}
				disabled={performanceGroups.length === 0}
			>
				{allExpanded ? 'Collapse all' : 'Expand all'}
			</button>
		</div>
		<span class="text-muted-foreground text-xs">
			{performanceGroups.length} exercise{performanceGroups.length !== 1 ? 's' : ''}
		</span>
	</div>

	<div class="flex-1 px-4 pb-24 md:pb-4">
		{#if performanceGroups.length}
			<DragDropProvider {onDragStart} {onDragEnd}>
				<div class="flex flex-col gap-3">
					{#each performanceGroups as performanceGroup, index (performanceGroup._id)}
						{@const isExpanded = expandedGroupIds.includes(performanceGroup._id)}
						<SortableExerciseCard
							{performanceGroup}
							{index}
							{isExpanded}
							onToggle={() => toggleExpand(performanceGroup._id)}
							onDelete={() => {
								client.mutation(api.performanceGroups.remove, { id: performanceGroup._id });
							}}
						/>
					{/each}
				</div>
			</DragDropProvider>
		{/if}
	</div>

	<!-- Mobile FAB -->
	<div class="fixed right-6 bottom-6 z-50 md:hidden">
		<ExerciseSelection {onExerciseAdded}>
			{#snippet trigger()}
				<Dialog.Trigger>
					{#snippet child({ props })}
						<button
							{...props}
							class="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#c45c26] to-[#a04a1e] text-white shadow-xl shadow-[#c45c26]/30 transition-transform hover:scale-105 active:scale-95"
							aria-label="Add exercise"
						>
							<PlusIcon class="size-8" strokeWidth={2.5} />
						</button>
					{/snippet}
				</Dialog.Trigger>
			{/snippet}
		</ExerciseSelection>
	</div>

	<!-- Desktop Add Button -->
	<div class="hidden md:block md:px-4">
		<ExerciseSelection {onExerciseAdded}>
			{#snippet trigger()}
				<Dialog.Trigger>
					{#snippet child({ props })}
						<Button
							{...props}
							variant="outline"
							size="lg"
							class="w-full justify-center py-6 text-base font-medium"
							role="combobox"
						>
							<PlusIcon class="mr-2 size-5" />
							Add exercise
						</Button>
					{/snippet}
				</Dialog.Trigger>
			{/snippet}
		</ExerciseSelection>
	</div>
</div>
