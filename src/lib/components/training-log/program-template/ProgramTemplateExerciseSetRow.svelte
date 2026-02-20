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
			targetSetRange: string,
			targetValue: string
		) => Promise<void> | void;
		onRemove: (id: Id<'performanceSets'>) => Promise<void> | void;
		canRemove: boolean;
	} = $props();

	let targetSetRangeValue = $derived(setTarget.programTargetSetRange ?? '1');
	let targetRangeValue = $derived(
		executionType === 'reps'
			? (setTarget.programTargetRepsRange ?? '8')
			: (setTarget.programTargetDuration ?? '60 sec')
	);
	let targetRangePlaceholder = $derived(
		executionType === 'reps' ? 'e.g. 8 or 10-15' : 'e.g. 45 sec or 30-45 sec'
	);
	let targetRangeLabel = $derived(
		executionType === 'reps' ? 'Rep target or range' : 'Time target or range'
	);
</script>

<div class="flex items-end gap-2.5 py-1">
	<span
		class="text-muted-foreground/60 grid size-5 shrink-0 -translate-y-1.5 place-items-center rounded-full border-2 text-right text-sm leading-none tabular-nums"
	>
		{order}
	</span>
	<label class="space-y-1">
		<span class="text-muted-foreground/70 block text-[10px]">Set count or range</span>
		<Input
			type="text"
			value={targetSetRangeValue}
			placeholder="e.g. 1 or 3-4"
			class="h-8 w-24 text-center text-sm"
			onchange={(event) =>
				onUpdate(setTarget._id, executionType, event.currentTarget.value, targetRangeValue)}
		/>
	</label>
	<span class="text-muted-foreground/70 -translate-y-1.5 text-base">&times;</span>
	<label class="space-y-1">
		<span class="text-muted-foreground/70 block text-[10px]">{targetRangeLabel}</span>
		<Input
			type="text"
			value={targetRangeValue}
			placeholder={targetRangePlaceholder}
			class="h-8 w-40 text-center text-xs"
			onchange={(event) =>
				onUpdate(setTarget._id, executionType, targetSetRangeValue, event.currentTarget.value)}
		/>
	</label>
	{#if canRemove}
		<button
			type="button"
			class="text-muted-foreground/30 hover:text-destructive mb-1 ml-auto transition-colors"
			onclick={() => onRemove(setTarget._id)}
		>
			<XIcon class="size-3.5" />
		</button>
	{/if}
</div>
