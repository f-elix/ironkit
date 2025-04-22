<script lang="ts">
	import { triplit } from '$lib/db/triplit';
	import { useQuery } from '@triplit/svelte';
	import ExerciseSelection from '$lib/components/training-log/ExerciseSelection.svelte';
	import PerformanceGroup from '$lib/components/training-log/PerformanceGroup.svelte';
	import { Accordion } from 'bits-ui';
	import { buttonVariants } from '$lib/shadcn/button';
	import PerformanceGroupSummary from '$lib/components/training-log/PerformanceGroupSummary.svelte';

	let { workoutId }: { workoutId: string } = $props();

	const query = useQuery(
		triplit,
		triplit
			.query('performanceGroups')
			.Where('workoutId', '=', workoutId)
			.Order('workoutOrder', 'ASC')
			.Include('performances', (rel) => {
				return rel('performances')
					.Order('groupOrder', 'ASC')
					.Include('exercise')
					.Include('sets', (setsRel) => {
						return setsRel('sets').Order('performanceOrder', 'ASC');
					});
			})
	);

	let performanceGroups = $derived(query.results ?? []);
	let lastOrder = $derived(performanceGroups?.at(-1)?.workoutOrder ?? 0);
	let selectedPerformanceGroupId = $state<string>();
</script>

<div class="mt-4 flex flex-col gap-4">
	<Accordion.Root type="single" class="flex flex-col gap-4" bind:value={selectedPerformanceGroupId}>
		{#each performanceGroups as performanceGroup (performanceGroup.id)}
			<Accordion.Item value={performanceGroup.id}>
				{#if selectedPerformanceGroupId !== performanceGroup.id}
					<Accordion.Trigger
						class={buttonVariants({
							variant: 'secondary',
							class: 'h-auto w-full'
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
		{/each}
	</Accordion.Root>
	<ExerciseSelection
		{workoutId}
		{lastOrder}
		onExerciseAdded={(data) => {
			selectedPerformanceGroupId = data.performanceGroup.id;
		}}
	/>
</div>
