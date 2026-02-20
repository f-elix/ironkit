<script lang="ts">
	import type { Doc, Id } from '$convex/_generated/dataModel';
	import Input from '$lib/shadcn/input/input.svelte';
	import XIcon from '@lucide/svelte/icons/x';

	let {
		setTarget,
		executionType,
		order,
		onUpdate,
		onRemove,
		canRemove
	}: {
		setTarget: Doc<'performanceSets'>;
		executionType: 'reps' | 'time';
		order: number;
		onUpdate: (
			id: Id<'performanceSets'>,
			executionType: 'reps' | 'time',
			value: number
		) => Promise<void> | void;
		onRemove: (id: Id<'performanceSets'>) => Promise<void> | void;
		canRemove: boolean;
	} = $props();

	let inputValue = $derived(
		executionType === 'reps'
			? (setTarget.programTargetReps ?? 8)
			: (setTarget.programTargetDurationSeconds ?? 60)
	);
</script>

<div class="flex items-center gap-2.5 py-1">
	<span class="text-muted-foreground/60 w-5 text-right text-xs tabular-nums">{order}</span>
	<Input
		type="number"
		min="1"
		value={inputValue}
		class="h-8 w-20 text-center text-sm tabular-nums"
		onchange={(e) => onUpdate(setTarget._id, executionType, e.currentTarget.valueAsNumber)}
	/>
	<span class="text-muted-foreground/50 text-xs">
		{executionType === 'reps' ? 'reps' : 'sec'}
	</span>
	{#if canRemove}
		<button
			type="button"
			class="text-muted-foreground/30 hover:text-destructive ml-auto transition-colors"
			onclick={() => onRemove(setTarget._id)}
		>
			<XIcon class="size-3.5" />
		</button>
	{/if}
</div>
