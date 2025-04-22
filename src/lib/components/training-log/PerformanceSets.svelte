<script lang="ts">
	import PerformanceSet from '$lib/components/training-log/PerformanceSet.svelte';
	import type { WorkoutWithRelations } from '$lib/db/types';
	import Button from '$lib/shadcn/button/button.svelte';
	import Plus from '@lucide/svelte/icons/plus';
	import Minus from '@lucide/svelte/icons/circle-minus';
	import { triplit } from '$lib/db/triplit';
	import Label from '$lib/shadcn/label/label.svelte';
	import Textarea from '$lib/shadcn/textarea/textarea.svelte';

	type Performance = WorkoutWithRelations['performanceGroups'][number]['performances'][number];

	let { performance }: { performance: Performance } = $props();

	let sets = $derived(performance.sets);
	let unit = $derived(performance.weightUnit);
	let exercise = $derived(performance.exercise);

	const addSet = () => {
		const lastSet = sets.at(-1);
		const performanceOrder = lastSet?.performanceOrder ?? 0;
		triplit.insert('performanceSets', {
			performanceId: performance.id,
			performanceOrder: performanceOrder + 1
		});
	};

	const deleteSet = (setId: string) => {
		triplit.delete('performanceSets', setId);
	};
</script>

<div class="flex flex-col gap-2">
	<ul class="flex flex-col gap-2">
		{#each sets as set (set.id)}
			<li class="flex flex-col gap-2">
				<div class="flex items-center justify-between gap-2">
					<PerformanceSet {set} {unit} {exercise} />
					<div class="flex items-center">
						<Button
							size="icon"
							variant="ghost"
							class="ml-auto text-destructive"
							onclick={() => {
								deleteSet(set.id);
							}}
							aria-label="Delete set"
						>
							<Minus />
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
	<Button size="sm" variant="secondary" class="w-full" onclick={addSet}>
		<Plus />
		Add set
	</Button>
</div>
