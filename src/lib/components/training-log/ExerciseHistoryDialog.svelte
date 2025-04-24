<script lang="ts">
	import type { WorkoutWithRelations } from '$lib/db/types';
	import Button from '$lib/shadcn/button/button.svelte';
	import * as Dialog from '$lib/shadcn/dialog';
	import * as Tabs from '$lib/shadcn/tabs';
	import History from '@lucide/svelte/icons/history';
	import PastPerformancesList from '$lib/components/training-log/PastPerformancesList.svelte';
	import { today } from '@internationalized/date';
	import { TIMEZONE } from '$lib/constants';

	type Performance = WorkoutWithRelations['performanceGroups'][number]['performances'][number];

	let { performance }: { performance: Performance } = $props();

	const tabItems = [
		{
			label: 'Up to workout',
			value: 'upToWorkout',
			upToDate: performance.workout?.date
		},
		{
			label: 'All time',
			value: 'allTime',
			upToDate: today(TIMEZONE).toDate(TIMEZONE)
		}
	];

	let exerciseId = $derived(performance.exerciseId);

	let value = $state(tabItems[0].value);
</script>

<Dialog.Root>
	<Dialog.Trigger>
		<Button size="icon" variant="ghost" aria-label="View exercise history" class="w-8">
			<History />
		</Button>
	</Dialog.Trigger>
	<Dialog.Content class="w-[90vw] max-w-2xl">
		<Dialog.Title>Exercise history</Dialog.Title>
		<Tabs.Root bind:value>
			<Tabs.List class="grid w-full grid-cols-2">
				{#each tabItems as item}
					<Tabs.Trigger value={item.value}>{item.label}</Tabs.Trigger>
				{/each}
			</Tabs.List>
			{#each tabItems as item}
				<Tabs.Content value={item.value}>
					<PastPerformancesList {exerciseId} upToDate={item.upToDate} />
				</Tabs.Content>
			{/each}
		</Tabs.Root>
	</Dialog.Content>
</Dialog.Root>
