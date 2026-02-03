<script lang="ts">
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import ExerciseSelection from '$lib/components/training-log/ExerciseSelection.svelte';
	import { Accordion } from 'bits-ui';
	import Button from '$lib/shadcn/button/button.svelte';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import * as Dialog from '$lib/shadcn/dialog';
	import { addExerciseToWorkout } from '$lib/training-log/addExerciseToWorkout';
	import { DragDropProvider, type DragDropEvents } from '@dnd-kit-svelte/svelte';
	import { move } from '@dnd-kit/helpers';
	import SortablePerformanceGroupItem from '$lib/components/training-log/SortablePerformanceGroupItem.svelte';
	import type { Id } from '$convex/_generated/dataModel';

	let { workoutId }: { workoutId: Id<'workouts'> } = $props();

	const client = useConvexClient();
	const query = useQuery(api.performanceGroups.list, { workoutId });

	let performanceGroups = $derived(query.data ?? []);
	let lastOrder = $derived(performanceGroups?.at(-1)?.workoutOrder ?? 0);
	let selectedPerformanceGroupId = $state<string>();

	const onExerciseAdded = async (exerciseId: Id<'exercises'>) => {
		const result = await addExerciseToWorkout(client, workoutId, exerciseId, lastOrder + 1);
		selectedPerformanceGroupId = result.performanceGroupId;
	};

	const onDragEnd: DragDropEvents['dragend'] = async (event) => {
		const reorderedGroups = move(
			performanceGroups.map((item) => {
				return {
					...item,
					id: item._id
				};
			}),
			// Type assertion needed due to version mismatch between @dnd-kit-svelte and @dnd-kit/helpers
			event as unknown as Parameters<typeof move>[1]
		);

		await client.mutation(api.performanceGroups.updateOrder, {
			updates: reorderedGroups.map((item, index) => ({
				id: item._id,
				workoutOrder: index
			}))
		});
	};
</script>

<div class="flex grow flex-col gap-4 pb-20 md:pb-4">
	{#if performanceGroups.length}
		<DragDropProvider {onDragEnd}>
			<Accordion.Root type="single" bind:value={selectedPerformanceGroupId}>
				{#snippet child({ props })}
					<ol {...props} class="flex flex-col gap-4 outline-none">
						{#each performanceGroups as performanceGroup, index (performanceGroup._id)}
							<SortablePerformanceGroupItem
								performanceGroupId={performanceGroup._id}
								{index}
								isSelected={selectedPerformanceGroupId === performanceGroup._id}
								dragDisabled={!!selectedPerformanceGroupId}
							/>
						{/each}
					</ol>
				{/snippet}
			</Accordion.Root>
		</DragDropProvider>
	{/if}

	<!-- Desktop: Inline add exercise button -->
	<div class="hidden md:block">
		<ExerciseSelection {onExerciseAdded}>
			{#snippet trigger()}
				<Dialog.Trigger>
					{#snippet child({ props })}
						<Button
							variant="outline"
							size="lg"
							class="bg-muted w-full justify-center py-8"
							{...props}
							role="combobox"
						>
							Add exercise
							<PlusIcon />
						</Button>
					{/snippet}
				</Dialog.Trigger>
			{/snippet}
		</ExerciseSelection>
	</div>

	<!-- Mobile: Floating Action Button -->
	<div class="fixed right-4 bottom-4 z-50 md:hidden">
		<ExerciseSelection {onExerciseAdded}>
			{#snippet trigger()}
				<Dialog.Trigger>
					{#snippet child({ props })}
						<Button
							size="icon"
							class="bg-primary text-primary-foreground hover:bg-primary/90 size-14 rounded-full shadow-lg"
							{...props}
							role="combobox"
							aria-label="Add exercise"
						>
							<PlusIcon class="size-7" />
						</Button>
					{/snippet}
				</Dialog.Trigger>
			{/snippet}
		</ExerciseSelection>
	</div>
</div>
