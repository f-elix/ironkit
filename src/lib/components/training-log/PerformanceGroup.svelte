<script lang="ts">
	import Performance from '$lib/components/training-log/Performance.svelte';
	import { triplit } from '$lib/db/triplit';
	import type { WorkoutWithRelations } from '$lib/db/types';
	import Button, { buttonVariants } from '$lib/shadcn/button/button.svelte';
	import * as Card from '$lib/shadcn/card';
	import * as Dialog from '$lib/shadcn/dialog';
	import Separator from '$lib/shadcn/separator/separator.svelte';
	import Plus from '@lucide/svelte/icons/plus';
	import ExerciseSelection from '$lib/components/training-log/ExerciseSelection.svelte';
	import { addExerciseToPeformanceGroup } from '$lib/training-log/addExerciseToPeformanceGroup';
	import Label from '$lib/shadcn/label/label.svelte';
	import Input from '$lib/shadcn/input/input.svelte';
	import Check from '@lucide/svelte/icons/check';
	import { Accordion } from 'bits-ui';

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

	const onLabelChange = async (event: Event) => {
		const value = (event.currentTarget as HTMLInputElement).value;
		await triplit.update('performanceGroups', performanceGroup.id, { label: value });
	};
</script>

<Card.Root class="bg-muted/30 py-0">
	<Card.Content class="flex flex-col gap-4 p-4">
		{#if performances.length > 1}
			<div class="flex flex-row items-center justify-between gap-2">
				<Label class="grow">
					<span class="sr-only">Group title</span>
					<Input type="text" placeholder="Group title" value={label} oninput={onLabelChange} />
				</Label>
			</div>
		{/if}
		<ul class="divide-border flex flex-col gap-4 divide-y">
			{#each performances as performance (performance.id)}
				<li class="flex flex-col gap-2 pb-4 last:pb-0">
					<Performance {performance} {onDelete} />
				</li>
			{/each}
		</ul>
		<Separator />
		<div class="grid gap-2">
			<ExerciseSelection {onExerciseAdded}>
				{#snippet trigger()}
					<Dialog.Trigger class={buttonVariants({ variant: 'secondary', class: 'w-full' })}>
						<Plus />
						{#if performances.length < 2}
							Add exercise to create superset
						{:else}
							Add exercise to superset
						{/if}
					</Dialog.Trigger>
				{/snippet}
			</ExerciseSelection>
			<Accordion.Trigger class="w-full">
				{#snippet child({ props })}
					<Button aria-label="Show exercise summary" {...props}>
						<Check />
						Done
					</Button>
				{/snippet}
			</Accordion.Trigger>
		</div>
	</Card.Content>
</Card.Root>
