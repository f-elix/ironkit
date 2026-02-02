<script lang="ts">
	import Performance from '$lib/components/training-log/Performance.svelte';
	import Button, { buttonVariants } from '$lib/shadcn/button/button.svelte';
	import * as Card from '$lib/shadcn/card';
	import * as Dialog from '$lib/shadcn/dialog';
	import Separator from '$lib/shadcn/separator/separator.svelte';
	import Plus from '@lucide/svelte/icons/plus';
	import ExerciseSelection from '$lib/components/training-log/ExerciseSelection.svelte';
	import { addExerciseToPerformanceGroup } from '$lib/training-log/addExerciseToPerformanceGroup';
	import Label from '$lib/shadcn/label/label.svelte';
	import Input from '$lib/shadcn/input/input.svelte';
	import Check from '@lucide/svelte/icons/check';
	import { Accordion } from 'bits-ui';
	import ClosePeformanceButton from '$lib/components/training-log/ClosePeformanceButton.svelte';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import Badge from '$lib/shadcn/badge/badge.svelte';

	let { performanceGroupId }: { performanceGroupId: Id<'performanceGroups'> } = $props();

	const client = useConvexClient();
	const query = useQuery(api.performanceGroups.getById, { id: performanceGroupId });

	let performanceGroup = $derived(query.data);
	let label = $derived(performanceGroup?.label);
	let performances = $derived(performanceGroup?.performances ?? []);

	// Auto-generate group type based on exercise count
	let autoGroupType = $derived.by(() => {
		const count = performances.length;
		if (count === 2) {
			return 'Superset';
		}
		if (count === 3) {
			return 'Triset';
		}
		if (count >= 4) {
			return 'Circuit';
		}
		return null;
	});

	// Placeholder text for the input
	let placeholderText = $derived(autoGroupType ? `${autoGroupType} name (optional)` : 'Group name');

	// Display badge text
	let displayBadge = $derived(label || autoGroupType);

	const onExerciseAdded = async (exerciseId: Id<'exercises'>) => {
		if (!performanceGroup) {
			return;
		}
		const lastOrder = performances.at(-1)?.groupOrder ?? 0;
		await addExerciseToPerformanceGroup(client, performanceGroup, exerciseId, lastOrder + 1);
	};

	const onGroupDelete = async () => {
		if (!performanceGroup) {
			return;
		}
		await client.mutation(api.performanceGroups.remove, { id: performanceGroup._id });
	};

	const onPerformanceDelete = (performanceId: Id<'performances'>) => {
		return client.mutation(api.performances.remove, { id: performanceId });
	};

	const onDelete = (performanceId: Id<'performances'>) => {
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

<Card.Root class="bg-card rounded-lg border py-0 shadow-sm">
	<Card.Content class="flex flex-col gap-4 p-4">
		{#if performances.length > 1}
			<div class="flex items-center gap-2">
				{#if displayBadge && !label}
					<Badge variant="secondary" class="shrink-0 text-xs">{displayBadge}</Badge>
				{/if}
				<Label class="grow">
					<span class="sr-only">Group title</span>
					<Input
						type="text"
						placeholder={placeholderText}
						value={label}
						oninput={onLabelChange}
						class="text-sm"
					/>
				</Label>
				<ClosePeformanceButton />
			</div>
		{/if}
		<ul class="relative flex flex-col gap-4">
			{#each performances as performance, i (performance._id)}
				<li class="flex flex-col gap-4">
					{#if i > 0}
						<Separator />
					{/if}
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
						Add exercise
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
