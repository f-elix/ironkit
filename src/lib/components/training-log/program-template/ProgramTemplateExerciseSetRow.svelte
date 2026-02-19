<script lang="ts">
	import type { Doc, Id } from '$convex/_generated/dataModel';
	import Button from '$lib/shadcn/button/button.svelte';
	import Input from '$lib/shadcn/input/input.svelte';
	import Label from '$lib/shadcn/label/label.svelte';

	let {
		setTarget,
		executionType,
		order,
		showDivider = false,
		onUpdate,
		onRemove,
		canRemove
	}: {
		setTarget: Doc<'performanceSets'>;
		executionType: 'reps' | 'time';
		order: number;
		showDivider?: boolean;
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

<div
	class={[
		'grid grid-cols-[auto_1fr_auto] items-end gap-2 px-1 py-2 md:grid-cols-[auto_10rem_auto] md:justify-start md:gap-3',
		showDivider && 'border-border/60 border-t pt-3'
	]}
>
	<span class="text-muted-foreground text-xs">Set {order}</span>
	<Label class="grid gap-1 md:w-40">
		<span class="text-xs">{executionType === 'reps' ? 'Reps' : 'Seconds'}</span>
		<Input
			type="number"
			min="1"
			value={inputValue}
			onchange={(event) => onUpdate(setTarget._id, executionType, event.currentTarget.valueAsNumber)}
		/>
	</Label>
	<Button
		variant="ghost"
		size="sm"
		class="text-destructive hover:text-destructive justify-self-end md:justify-self-auto md:border md:border-red-900/50 md:bg-red-950/20 md:hover:bg-red-950/35"
		onclick={() => onRemove(setTarget._id)}
		disabled={!canRemove}
	>
		Remove
	</Button>
</div>
