<script lang="ts">
	import PerformanceSet from '$lib/components/training-log/PerformanceSet.svelte';
	import type { WorkoutWithRelations } from '$lib/db/types';
	import Button from '$lib/shadcn/button/button.svelte';
	import Plus from '@lucide/svelte/icons/circle-plus';
	import Minus from '@lucide/svelte/icons/circle-minus';
	import { triplit } from '$lib/db/triplit';
	import Label from '$lib/shadcn/label/label.svelte';
	import Textarea from '$lib/shadcn/textarea/textarea.svelte';
	import { scale } from 'svelte/transition';
	import { expoOut } from 'svelte/easing';
	import { flip } from 'svelte/animate';

	type Performance = WorkoutWithRelations['performanceGroups'][number]['performances'][number];

	let { performance }: { performance: Performance } = $props();

	let sets = $derived(performance.sets);
	let unit = $derived(performance.weightUnit);
	let exercise = $derived(performance.exercise);

	const addSet = (currentOrder: number, nextOrder: Maybe<number>) => {
		const performanceOrder = nextOrder
			? (nextOrder - currentOrder) / 2 + currentOrder
			: currentOrder + 1;
		triplit.insert('performanceSets', {
			userId: performance.userId,
			performanceId: performance.id,
			performanceOrder
		});
	};

	const deleteSet = (setId: string) => {
		triplit.delete('performanceSets', setId);
	};
</script>

<ol class="flex flex-col gap-6">
	{#each sets as set, i (set.id)}
		<li
			class="flex origin-top flex-col gap-2"
			in:scale={{ duration: 500, easing: expoOut, start: 0.5, opacity: 0.5 }}
			out:scale={{ duration: 300, easing: expoOut, start: 0.5, opacity: 0 }}
			animate:flip={{ duration: 500, easing: expoOut }}
		>
			<div class="flex items-center justify-between gap-2">
				<div class="flex w-full items-center gap-2">
					<div
						class="bg-primary text-primary-foreground grid size-5 place-items-center rounded-full text-center text-sm font-medium"
					>
						{i + 1}
					</div>
					<PerformanceSet {set} {unit} {exercise} />
					{#if i > 0}
						<Button
							size="sm"
							variant="link"
							class="ml-auto"
							onclick={() => {
								deleteSet(set.id);
							}}
							aria-label="Remove set"
						>
							<Minus class="text-destructive" />
						</Button>
					{/if}
				</div>
			</div>
			<Label class="flex flex-col gap-2">
				<span class="sr-only">Set note</span>
				<Textarea
					rows={1}
					class="min-h-none text-sm font-normal"
					placeholder="Set note (RIR, RPE, etc.)"
					value={set.note}
					oninput={(event) => {
						triplit.update('performanceSets', set.id, {
							note: event.currentTarget.value
						});
					}}
				/>
			</Label>
			<div class="flex gap-2">
				<Button
					size="sm"
					variant="secondary"
					class="h-7 flex-1"
					onclick={() => {
						addSet(set.performanceOrder, sets[i + 1]?.performanceOrder);
					}}
				>
					<Plus />
					Add set
				</Button>
			</div>
		</li>
	{/each}
</ol>
