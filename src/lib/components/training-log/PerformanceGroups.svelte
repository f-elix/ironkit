<script lang="ts">
	import { triplit } from '$lib/db/triplit';
	import { useQuery } from '@triplit/svelte';
	import ExerciseSelection from '$lib/components/training-log/ExerciseSelection.svelte';
	import PerformanceGroup from '$lib/components/training-log/PerformanceGroup.svelte';
	import { Accordion } from 'bits-ui';
	import { buttonVariants } from '$lib/shadcn/button';

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

<div class="mt-6 flex flex-col gap-4">
	<Accordion.Root type="single" class="flex flex-col gap-4" bind:value={selectedPerformanceGroupId}>
		{#each performanceGroups as performanceGroup (performanceGroup.id)}
			{@const label = performanceGroup.label}
			{@const performances = performanceGroup.performances}
			<Accordion.Item value={performanceGroup.id}>
				{#if selectedPerformanceGroupId !== performanceGroup.id}
					<Accordion.Trigger
						class={buttonVariants({
							variant: 'secondary',
							class: 'flex h-auto w-full flex-col items-start gap-2 py-6 text-left'
						})}
					>
						{#if label}
							<div class="text-sm text-muted-foreground">{label}</div>
						{/if}
						{#each performances as performance (performance.id)}
							<p class="text-lg font-semibold">
								{performance.exercise?.name ?? 'Unnamed exercise'}
							</p>
							{#if performance.note}
								<p class="whitespace-normal text-sm text-muted-foreground">{performance.note}</p>
							{/if}
						{/each}
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
