<script lang="ts">
	import Performance from '$lib/components/training-log/Performance.svelte';
	import { triplit } from '$lib/db/triplit';
	import type { WorkoutWithRelations } from '$lib/db/types';
	import Button from '$lib/shadcn/button/button.svelte';
	import * as Card from '$lib/shadcn/card';
	import * as Dialog from '$lib/shadcn/dialog';
	import Separator from '$lib/shadcn/separator/separator.svelte';
	import Trash from '@lucide/svelte/icons/trash';
	import Plus from '@lucide/svelte/icons/plus';
	import ExerciseSelection from '$lib/components/training-log/ExerciseSelection.svelte';
	import { addExerciseToPeformanceGroup } from '$lib/training-log/addExerciseToPeformanceGroup';

	type PerformanceGroup = WorkoutWithRelations['performanceGroups'][number];

	let { performanceGroup }: { performanceGroup: PerformanceGroup } = $props();

	let label = $derived(performanceGroup.label);
	let performances = $derived(performanceGroup.performances);

	const onDelete = () => {
		triplit.delete('performanceGroups', performanceGroup.id);
	};

	const onExerciseAdded = async (exerciseId: string) => {
		const lastOrder = performances.at(-1)?.groupOrder ?? 0;
		await addExerciseToPeformanceGroup(performanceGroup, exerciseId, lastOrder + 1);
	};
</script>

<Card.Root class="bg-muted/30">
	<Card.Header class="flex w-full items-center justify-between p-4">
		{#if label}
			<Card.Title>{label}</Card.Title>
		{/if}
		<Button
			variant="destructive"
			size="icon"
			class="ml-auto"
			aria-label={performances.length > 1 ? 'Delete exercise group' : 'Delete exercise'}
			onclick={onDelete}
		>
			<Trash />
		</Button>
	</Card.Header>
	<Card.Content class="p-4">
		<ul class="flex flex-col gap-2">
			{#each performances as performance (performance.id)}
				<li class="flex flex-col gap-2">
					<Performance {performance} />
				</li>
			{/each}
		</ul>
		<Separator class="my-4" />
		<ExerciseSelection {onExerciseAdded}>
			{#snippet trigger()}
				<Dialog.Trigger>
					{#snippet child({ props })}
						<Button variant="outline" class="w-full" {...props}>
							<Plus />
							Add exercise to group
						</Button>
					{/snippet}
				</Dialog.Trigger>
			{/snippet}
		</ExerciseSelection>
	</Card.Content>
</Card.Root>
