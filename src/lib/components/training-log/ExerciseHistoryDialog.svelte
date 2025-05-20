<script lang="ts">
	import type { WorkoutWithRelations } from '$lib/db/types';
	import { buttonVariants } from '$lib/shadcn/button/button.svelte';
	import * as Dialog from '$lib/shadcn/dialog';
	import * as Tabs from '$lib/shadcn/tabs';
	import History from '@lucide/svelte/icons/history';
	import PastPerformancesList from '$lib/components/training-log/PastPerformancesList.svelte';

	type Performance = WorkoutWithRelations['performanceGroups'][number]['performances'][number];

	let { performance }: { performance: Performance } = $props();

	const allTimeId = 'allTime';
	const upToWorkoutId = 'upToWorkout';

	let exerciseId = $derived(performance.exerciseId);
</script>

<Dialog.Root>
	<Dialog.Trigger
		class={buttonVariants({ variant: 'secondary', size: 'icon', class: 'text-amber-500' })}
		aria-label="View exercise history"
	>
		<History />
	</Dialog.Trigger>
	<Dialog.Content class="w-[90vw] max-w-2xl p-5 pb-0">
		<Dialog.Title>Exercise history</Dialog.Title>
		<Tabs.Root>
			<Tabs.List class="grid w-full grid-cols-2">
				<Tabs.Trigger class="font-normal" value={allTimeId}>All time</Tabs.Trigger>
				<Tabs.Trigger class="font-normal" value={upToWorkoutId}>Up to this workout</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value={allTimeId}>
				<PastPerformancesList {exerciseId} />
			</Tabs.Content>
			<Tabs.Content value={upToWorkoutId}>
				<PastPerformancesList {exerciseId} currentWorkout={performance.workout} />
			</Tabs.Content>
		</Tabs.Root>
	</Dialog.Content>
</Dialog.Root>
