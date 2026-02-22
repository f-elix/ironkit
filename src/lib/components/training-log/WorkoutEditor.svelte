<script lang="ts">
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import ExerciseSelection from '$lib/components/training-log/ExerciseSelection.svelte';
	import * as Dialog from '$lib/shadcn/dialog';
	import { buttonVariants } from '$lib/shadcn/button/button.svelte';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { addExerciseToWorkout } from '$lib/training-log/addExerciseToWorkout';
	import { DragDropProvider, type DragDropEvents } from '@dnd-kit-svelte/svelte';
	import { move } from '@dnd-kit/helpers';
	import SortableExerciseCard from '$lib/components/training-log/SortableExerciseCard.svelte';
	import type { Id } from '$convex/_generated/dataModel';
	import { cn } from '$lib/shadcn/utils';
	import WorkoutStats from '$lib/components/training-log/WorkoutStats.svelte';
	import type { Workout } from '$lib/db/types';

	let { workoutId, workout }: { workoutId: Id<'workouts'>; workout: Workout } = $props();

	const client = useConvexClient();
	const groupsQuery = useQuery(api.performanceGroups.list, { workoutId });

	let performanceGroups = $derived(groupsQuery.data ?? []);
	let lastOrder = $derived(performanceGroups?.at(-1)?.workoutOrder ?? 0);
	let dragSnapshot = $state<typeof performanceGroups | null>(null);

	// Using a simple array to track expanded state - reactive via $state
	let expandedGroupIds = $state<string[]>([]);

	let someExpanded = $derived(
		performanceGroups.length > 0 && performanceGroups.some((g) => expandedGroupIds.includes(g._id))
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
		dragSnapshot = $state.snapshot(
			performanceGroups.map((pg) => ({
				...pg,
				id: pg._id
			}))
		);
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

		dragSnapshot = null;

		await client.mutation(api.performanceGroups.updateOrder, {
			updates: reorderedGroups.map((item, index) => ({
				id: item._id,
				workoutOrder: index
			}))
		});
	};
</script>

<div class="flex min-h-full flex-col">
	<WorkoutStats {workout} {workoutId} />
	<div class="p-4 pt-2">
		<button
			class={cn(
				'rounded px-2 py-1 text-xs font-medium transition-colors',
				someExpanded
					? 'bg-primary/20 text-primary'
					: 'bg-muted text-muted-foreground hover:text-foreground'
			)}
			onclick={someExpanded ? collapseAll : expandAll}
			disabled={performanceGroups.length === 0}
		>
			{someExpanded ? 'Collapse all' : 'Expand all'}
		</button>
	</div>

	<div class="px-4 pb-24 md:pb-4">
		{#if performanceGroups.length}
			<DragDropProvider {onDragStart} {onDragEnd}>
				<ul class="flex flex-col gap-3">
					{#each performanceGroups as performanceGroup, index (performanceGroup._id)}
						{@const isExpanded = expandedGroupIds.includes(performanceGroup._id)}
						<SortableExerciseCard
							{performanceGroup}
							{index}
							{isExpanded}
							onToggle={() => toggleExpand(performanceGroup._id)}
						/>
					{/each}
				</ul>
			</DragDropProvider>
		{/if}
	</div>

	<!-- Mobile FAB -->
	<div class="fixed right-4 bottom-8 z-50 md:hidden">
		<ExerciseSelection {onExerciseAdded}>
			{#snippet trigger()}
				<Dialog.Trigger>
					{#snippet child({ props })}
						<button
							{...props}
							class="bg-primary text-primary-foreground hover:bg-primary/90 flex size-14 items-center justify-center rounded-full"
							aria-label="Add exercise"
						>
							<PlusIcon class="size-7" />
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
				<Dialog.Trigger
					class={buttonVariants({
						variant: 'outline',
						size: 'lg',
						class: 'w-full justify-center py-6 text-base font-medium'
					})}
				>
					<PlusIcon class="mr-2 size-5" />
					Add exercise
				</Dialog.Trigger>
			{/snippet}
		</ExerciseSelection>
	</div>
</div>
