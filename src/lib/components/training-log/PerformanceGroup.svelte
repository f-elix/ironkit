<script lang="ts">
	import Performance from '$lib/components/training-log/Performance.svelte';
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
	import ClosePeformanceButton from '$lib/components/training-log/ClosePeformanceButton.svelte';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';

	let { performanceGroupId }: { performanceGroupId: Id<'performanceGroups'> } = $props();

	const client = useConvexClient();
	const query = useQuery(api.performanceGroups.getById, { id: performanceGroupId });

	let performanceGroup = $derived(query.data);
	let label = $derived(performanceGroup?.label);
	let performances = $derived(performanceGroup?.performances ?? []);

	const onExerciseAdded = async (exerciseId: string) => {
		if (!performanceGroup) {
			return;
		}
		const lastOrder = performances.at(-1)?.groupOrder ?? 0;
		await addExerciseToPeformanceGroup(client, performanceGroup, exerciseId, lastOrder + 1);
	};

	const onGroupDelete = async () => {
		if (!performanceGroup) {
			return;
		}
		await client.mutation(api.performanceGroups.remove, { id: performanceGroup._id });
	};

	const onPerformanceDelete = (performanceId: string) => {
		return client.mutation(api.performances.remove, { id: performanceId });
	};

	const onDelete = (performanceId: string) => {
		if (performances.length > 1) {
			onPerformanceDelete(performanceId);
		} else {
			onGroupDelete();
		}
	};

	const onLabelChange = async (event: Event) => {
		if (!performanceGroup) {
			return;
		}
		const value = (event.currentTarget as HTMLInputElement).value;
		await client.mutation(api.performanceGroups.update, {
			id: performanceGroup._id,
			label: value
		});
	};
</script>

<Card.Root class="bg-muted/30 rounded-sm py-0">
	<Card.Content class="flex flex-col gap-4 p-4">
		{#if performances.length > 1}
			<div class="flex items-center gap-2">
				<Label class="grow">
					<span class="sr-only">Group title</span>
					<Input
						type="text"
						placeholder="Group title"
						value={label}
						oninput={onLabelChange}
						class="text-sm"
					/>
				</Label>
				<ClosePeformanceButton />
			</div>
		{/if}
		<ul class="divide-border flex flex-col gap-4 divide-y">
			{#each performances as performance (performance._id)}
				<li class="flex flex-col gap-2 pb-4 last:pb-0">
					<Performance {performance} {onDelete} showCloseButton={performances.length < 2} />
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
