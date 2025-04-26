<script lang="ts">
	import { triplit } from '$lib/db/triplit';
	import { useQuery } from '@triplit/svelte';
	import ExerciseSelection from '$lib/components/training-log/ExerciseSelection.svelte';
	import PerformanceGroup from '$lib/components/training-log/PerformanceGroup.svelte';
	import { Accordion } from 'bits-ui';
	import { buttonVariants } from '$lib/shadcn/button';
	import PerformanceGroupSummary from '$lib/components/training-log/PerformanceGroupSummary.svelte';
	import Button from '$lib/shadcn/button/button.svelte';
	import CirclePlus from '@lucide/svelte/icons/circle-plus';
	import * as Dialog from '$lib/shadcn/dialog';
	import { addExerciseToWorkout } from '$lib/training-log/addExerciseToWorkout';
	import GripIcon from '@lucide/svelte/icons/grip-vertical';
	import { dragHandle, dragHandleZone, type DndZoneAttributes } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import { expoOut } from 'svelte/easing';
	import type { WorkoutWithRelations } from '$lib/db/types';

	type PerformanceGroupType = WorkoutWithRelations['performanceGroups'][number];

	let { workoutId }: { workoutId: string } = $props();

	const FLIP_DURATION = 400;

	const query = useQuery(
		triplit,
		triplit
			.query('performanceGroups')
			.Where('workoutId', '=', workoutId)
			.Order('workoutOrder', 'ASC')
			.Include('performances', (performancesRel) => {
				return performancesRel('performances')
					.Order('groupOrder', 'ASC')
					.Include('exercise')
					.Include('sets', (setsRel) => {
						return setsRel('sets').Order('performanceOrder', 'ASC');
					})
					.Include('workout');
			})
	);

	let performanceGroups = $derived(query.results ?? []);
	let lastOrder = $derived(performanceGroups?.at(-1)?.workoutOrder ?? 0);
	let selectedPerformanceGroupId = $state<string>();

	const onExerciseAdded = async (exerciseId: string) => {
		const result = await addExerciseToWorkout(workoutId, exerciseId, lastOrder + 1);
		selectedPerformanceGroupId = result.performanceGroup.id;
	};

	const onconsider: DndZoneAttributes<PerformanceGroupType>['onconsider'] = async (e) => {
		const items = e.detail.items;
		performanceGroups = items;
	};

	const onfinalize: DndZoneAttributes<PerformanceGroupType>['onfinalize'] = async (e) => {
		const items = e.detail.items;
		performanceGroups = items;
		items.map(async (item, index) => {
			await triplit.update('performanceGroups', item.id, {
				workoutOrder: index
			});
		});
	};
</script>

<div class="flex grow flex-col gap-4">
	{#if performanceGroups.length}
		<Accordion.Root type="single" bind:value={selectedPerformanceGroupId}>
			{#snippet child({ props })}
				<ol
					use:dragHandleZone={{
						items: $state.snapshot(performanceGroups),
						flipDurationMs: FLIP_DURATION,
						dropTargetStyle: {},
						dragDisabled: !!selectedPerformanceGroupId
					}}
					{...props}
					class="flex flex-col gap-4"
					{onconsider}
					{onfinalize}
				>
					{#each performanceGroups as performanceGroup (performanceGroup.id)}
						<li
							class="flex"
							animate:flip={{
								// If the performance group is being edited, don't animate the flip
								duration: performanceGroup.id === selectedPerformanceGroupId ? 0 : FLIP_DURATION,
								easing: expoOut
							}}
						>
							<Accordion.Item value={performanceGroup.id} class="grow">
								{#if selectedPerformanceGroupId !== performanceGroup.id}
									<Accordion.Trigger
										class={buttonVariants({
											variant: 'secondary',
											class: 'h-auto w-full rounded-r-none'
										})}
									>
										<PerformanceGroupSummary {performanceGroup} />
									</Accordion.Trigger>
								{/if}
								<Accordion.Content forceMount>
									{#snippet child({ props, open })}
										{#if open}
											<!-- Forcemount so that `displayNote` inside the group is reset -->
											<div {...props}>
												<PerformanceGroup {performanceGroup} />
											</div>
										{/if}
									{/snippet}
								</Accordion.Content>
							</Accordion.Item>
							{#if selectedPerformanceGroupId !== performanceGroup.id}
								<div
									class="grid w-10 shrink-0 cursor-grab place-items-center rounded-r-sm bg-gray-900 active:cursor-grabbing"
									use:dragHandle
									tabindex="0"
									aria-label="Drag to reorder"
								>
									<GripIcon />
								</div>
							{/if}
						</li>
					{/each}
				</ol>
			{/snippet}
		</Accordion.Root>
	{/if}
	<ExerciseSelection {onExerciseAdded}>
		{#snippet trigger()}
			<Dialog.Trigger>
				{#snippet child({ props })}
					<Button
						variant="outline"
						size="lg"
						class="w-full justify-center bg-gray-900 py-8"
						{...props}
						role="combobox"
					>
						Add exercise
						<CirclePlus />
					</Button>
				{/snippet}
			</Dialog.Trigger>
		{/snippet}
	</ExerciseSelection>
</div>
