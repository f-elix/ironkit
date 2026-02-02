<script lang="ts">
	import PerformanceSet from '$lib/components/training-log/PerformanceSet.svelte';
	import type { WorkoutWithRelations } from '$lib/db/types';
	import Button from '$lib/shadcn/button/button.svelte';
	import Plus from '@lucide/svelte/icons/circle-plus';
	import Minus from '@lucide/svelte/icons/circle-minus';
	import Label from '$lib/shadcn/label/label.svelte';
	import Textarea from '$lib/shadcn/textarea/textarea.svelte';
	import { scale } from 'svelte/transition';
	import { expoOut } from 'svelte/easing';
	import { flip } from 'svelte/animate';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';

	type Performance = WorkoutWithRelations['performanceGroups'][number]['performances'][number];

	let { performance }: { performance: Performance } = $props();

	const client = useConvexClient();
	let sets = $derived(performance.sets);
	let unit = $derived(performance.weightUnit);
	let exercise = $derived(performance.exercise);

	const addSet = (currentOrder: number, nextOrder: Maybe<number>) => {
		const performanceOrder = nextOrder
			? (nextOrder - currentOrder) / 2 + currentOrder
			: currentOrder + 1;
		client.mutation(api.performanceSets.create, {
			performanceId: performance._id,
			performanceOrder
		});
	};

	const deleteSet = (setId: Id<'performanceSets'>) => {
		client.mutation(api.performanceSets.remove, { id: setId });
	};
</script>

<ol class="flex flex-col gap-3">
	{#each sets as set, i (set._id)}
		<li
			class="flex origin-top flex-col gap-2"
			in:scale={{ duration: 500, easing: expoOut, start: 0.5, opacity: 0.5 }}
			out:scale={{ duration: 300, easing: expoOut, start: 0.5, opacity: 0 }}
			animate:flip={{ duration: 500, easing: expoOut }}
		>
			<!-- Set input row with integrated order number -->
			<div class="flex items-center gap-2">
				<div class="flex-1">
					<PerformanceSet {set} {unit} {exercise} order={i + 1} />
				</div>
				{#if sets.length > 1}
					<Button
						size="icon"
						variant="ghost"
						class="size-8 shrink-0"
						onclick={() => {
							deleteSet(set._id);
						}}
						aria-label="Remove set {i + 1}"
					>
						<Minus class="text-destructive size-4" />
					</Button>
				{/if}
			</div>

			<Label class="pr-10">
				<span class="sr-only">Set note</span>
				<Textarea
					rows={1}
					class="min-h-none text-sm font-normal"
					placeholder="Note (RIR, RPE, etc.)"
					value={set.note}
					oninput={(event) => {
						client.mutation(api.performanceSets.update, {
							id: set._id,
							note: event.currentTarget.value
						});
					}}
				/>
			</Label>
		</li>
	{/each}

	<!-- Add set button at the end -->
	<li>
		<Button
			size="sm"
			variant="secondary"
			class="w-full"
			onclick={() => {
				const lastSet = sets.at(-1);
				addSet(lastSet?.performanceOrder ?? 0, undefined);
			}}
		>
			<Plus class="size-4" />
			Add set
		</Button>
	</li>
</ol>
