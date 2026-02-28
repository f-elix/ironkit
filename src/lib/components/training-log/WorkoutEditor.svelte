<script lang="ts">
	import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers';
	import ExerciseSelection from '$lib/components/training-log/ExerciseSelection.svelte';
	import * as Dialog from '$lib/shadcn/dialog';
	import { buttonVariants } from '$lib/shadcn/button/button.svelte';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { DragDropProvider } from '@dnd-kit/svelte';
	import { move } from '@dnd-kit/helpers';
	import SortableExerciseCard from '$lib/components/training-log/SortableExerciseCard.svelte';
	import { cn } from '$lib/shadcn/utils';
	import WorkoutStats from '$lib/components/training-log/WorkoutStats.svelte';
	import type { WorkoutData } from '$lib/jazz/workout';
	import type { ComponentProps } from 'svelte';
	import { PerformanceGroup, Performance, PerformanceSet } from '$lib/jazz/schema';
	import { deleteCoValues } from 'jazz-tools';
	import { DEFAULT_WEIGHT_UNIT } from '$lib/constants';
	import type { Exercise } from '$lib/jazz/types';

	let { workout }: { workout: WorkoutData } = $props();

	const performanceGroups = $derived(
		workout.performanceGroups.toSorted((a, b) => a.workoutOrder - b.workoutOrder)
	);
	const lastOrder = $derived(performanceGroups?.at(-1)?.workoutOrder ?? 0);

	let expandedGroupIds = $state<string[]>([]);

	const someExpanded = $derived(
		performanceGroups.length > 0 &&
			performanceGroups.some((g) => expandedGroupIds.includes(g.$jazz.id))
	);

	const toggleExpand = (groupId: string) => {
		if (expandedGroupIds.includes(groupId)) {
			expandedGroupIds = expandedGroupIds.filter((id) => id !== groupId);
		} else {
			expandedGroupIds = [...expandedGroupIds, groupId];
		}
	};

	const openNextGroup = (groupId: string) => {
		const currentIndex = performanceGroups.findIndex((g) => g.$jazz.id === groupId);
		if (currentIndex < 0) {
			return;
		}
		const nextGroupId = performanceGroups[currentIndex + 1]?.$jazz.id;
		if (!nextGroupId) {
			return;
		}

		expandedGroupIds = [
			...new Set([...expandedGroupIds.filter((id) => id !== groupId), nextGroupId])
		];
	};

	const expandAll = () => {
		expandedGroupIds = performanceGroups.map((g) => g.$jazz.id);
	};

	const collapseAll = () => {
		expandedGroupIds = [];
	};

	const onExerciseAdded = (exercise: Exercise) => {
		// Create initial performance set
		const initialSet = PerformanceSet.create({
			weight: undefined,
			reps: undefined,
			durationSeconds: undefined,
			note: undefined,
			performanceOrder: 1
		});

		// Create performance
		const performance = Performance.create({
			performanceGroupId: '', // Will be set when added to group
			exercise,
			performanceSets: [initialSet],
			groupOrder: 0,
			weightUnit: DEFAULT_WEIGHT_UNIT
		});

		// Create a new performance group for the exercise
		const newGroup = PerformanceGroup.create({
			workoutId: workout.$jazz.id,
			label: undefined,
			workoutOrder: lastOrder + 1,
			performances: [performance]
		});

		performance.$jazz.set('performanceGroupId', newGroup.$jazz.id);
		workout.performanceGroups.$jazz.push(newGroup);
		expandedGroupIds = [...expandedGroupIds, newGroup.$jazz.id];
	};

	const onDragEnd: ComponentProps<typeof DragDropProvider>['onDragEnd'] = (event) => {
		const reorderedGroups = move(
			performanceGroups.map((item) => ({
				...item,
				id: item.$jazz.id
			})),
			event
		);
		// Update the order of each group
		reorderedGroups.forEach((item, index) => {
			const group = performanceGroups.find((g) => g.$jazz.id === item.id);
			if (!group) {
				return;
			}
			group.$jazz.set('workoutOrder', index);
		});
	};

	const onRemoveGroup = async (groupId: string) => {
		workout.performanceGroups.$jazz.remove((g) => g.$jazz.id === groupId);
		await deleteCoValues(PerformanceGroup, groupId, {
			resolve: {
				performances: {
					$each: { performanceSets: { $each: true } }
				}
			}
		});
	};
</script>

<div class="flex min-h-full flex-col">
	<WorkoutStats {workout} />
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
			<DragDropProvider {onDragEnd} modifiers={[RestrictToVerticalAxis]}>
				<ul class="flex flex-col gap-3">
					{#each performanceGroups as performanceGroup, index (performanceGroup.$jazz.id)}
						{@const isExpanded = expandedGroupIds.includes(performanceGroup.$jazz.id)}
						{@const hasNextGroup = index < performanceGroups.length - 1}
						<SortableExerciseCard
							performanceGroupId={performanceGroup.$jazz.id}
							{index}
							{isExpanded}
							onToggle={() => toggleExpand(performanceGroup.$jazz.id)}
							onNext={hasNextGroup ? () => openNextGroup(performanceGroup.$jazz.id) : undefined}
							onRemoveGroup={() => onRemoveGroup(performanceGroup.$jazz.id)}
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
