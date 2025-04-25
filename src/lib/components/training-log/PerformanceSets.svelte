<script lang="ts">
	import PerformanceSet from '$lib/components/training-log/PerformanceSet.svelte';
	import type { WorkoutWithRelations } from '$lib/db/types';
	import Button from '$lib/shadcn/button/button.svelte';
	import Plus from '@lucide/svelte/icons/circle-plus';
	import Minus from '@lucide/svelte/icons/circle-minus';
	import { triplit } from '$lib/db/triplit';
	import Label from '$lib/shadcn/label/label.svelte';
	import Textarea from '$lib/shadcn/textarea/textarea.svelte';
	import { slide } from 'svelte/transition';
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
			performanceId: performance.id,
			performanceOrder
		});
	};

	const deleteSet = (setId: string) => {
		triplit.delete('performanceSets', setId);
	};

	/**
	 * Custom flip animation that only triggers when appending a set because
	 * the default flip animation doesn't play well with the slide transition.
	 */
	const customFlip = (
		node: HTMLElement,
		fromTo: Parameters<typeof flip>[1],
		params: Parameters<typeof flip>[2] & { index: number }
	) => {
		const appending = fromTo.from.top < fromTo.to.top;
		if (appending) {
			return {};
		}
		return flip(node, fromTo, params);
	};
</script>

<div class="flex flex-col gap-2">
	<ul class="flex flex-col gap-2">
		{#each sets as set, i (set.id)}
			<li
				class="flex flex-col gap-2"
				transition:slide={{ duration: 500, easing: expoOut }}
				animate:customFlip={{ duration: 500, easing: expoOut, index: i }}
			>
				<div class="flex items-center justify-between gap-2">
					<PerformanceSet {set} {unit} {exercise} />
					<div class="flex items-center">
						{#if sets.length > 1}
							<Button
								size="icon"
								variant="ghost"
								class="w-8 text-destructive"
								onclick={() => {
									deleteSet(set.id);
								}}
								aria-label="Delete set"
							>
								<Minus />
							</Button>
						{/if}
						<Button
							size="icon"
							variant="ghost"
							class="w-8"
							onclick={() => {
								addSet(set.performanceOrder, sets[i + 1]?.performanceOrder);
							}}
							aria-label="Add a set below"
						>
							<Plus />
						</Button>
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
			</li>
		{/each}
	</ul>
</div>
