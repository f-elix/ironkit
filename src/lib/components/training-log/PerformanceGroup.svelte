<script lang="ts">
	import Performance from '$lib/components/training-log/Performance.svelte';
	import { triplit } from '$lib/db/triplit';
	import type { WorkoutWithRelations } from '$lib/db/types';
	import Button from '$lib/shadcn/button/button.svelte';
	import * as Card from '$lib/shadcn/card';
	import * as Dialog from '$lib/shadcn/dialog';
	import Separator from '$lib/shadcn/separator/separator.svelte';
	import Plus from '@lucide/svelte/icons/plus';
	import ExerciseSelection from '$lib/components/training-log/ExerciseSelection.svelte';
	import { addExerciseToPeformanceGroup } from '$lib/training-log/addExerciseToPeformanceGroup';
	import Label from '$lib/shadcn/label/label.svelte';
	import Input from '$lib/shadcn/input/input.svelte';

	type PerformanceGroup = WorkoutWithRelations['performanceGroups'][number];

	let { performanceGroup }: { performanceGroup: PerformanceGroup } = $props();

	let label = $derived(performanceGroup.label);
	let performances = $derived(performanceGroup.performances);

	const onExerciseAdded = async (exerciseId: string) => {
		const lastOrder = performances.at(-1)?.groupOrder ?? 0;
		await addExerciseToPeformanceGroup(performanceGroup, exerciseId, lastOrder + 1);
	};

	const onGroupDelete = async () => {
		const sets = await triplit.fetch(
			triplit.query('performanceSets').Where(
				'performanceId',
				'in',
				performances.map((p) => p.id)
			)
		);
		triplit.transact(async (tx) => {
			for (const set of sets) {
				await tx.delete('performanceSets', set.id);
			}
			for (const performance of performances) {
				await tx.delete('performances', performance.id);
			}
			await tx.delete('performanceGroups', performanceGroup.id);
		});
	};

	const onPerformanceDelete = (performanceId: string) => {
		triplit.delete('performances', performanceId);
	};

	const onDelete = (performanceId: string) => {
		if (performances.length > 1) {
			onPerformanceDelete(performanceId);
		} else {
			onGroupDelete();
		}
	};
</script>

<Card.Root class="bg-muted/30">
	{#if performances.length > 1}
		<Card.Header class="p-4 pb-0">
			<Label>
				<Input
					type="text"
					placeholder="Group title"
					value={label}
					oninput={(e) => {
						triplit.update('performanceGroups', performanceGroup.id, {
							label: e.currentTarget.value
						});
					}}
				/>
			</Label>
		</Card.Header>
	{/if}
	<Card.Content class="p-4">
		<ul class="flex flex-col gap-4 divide-y divide-border">
			{#each performances as performance (performance.id)}
				<li class="flex flex-col gap-2 pt-4 first:pt-0">
					<Performance {performance} {onDelete} />
				</li>
			{/each}
		</ul>
		<Separator class="my-5" />
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
