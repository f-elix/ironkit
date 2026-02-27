<script lang="ts">
	import type { ProgramWorkoutExerciseTarget } from '$lib/jazz/types';
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
		setTarget: ProgramWorkoutExerciseTarget;
		executionType: 'reps' | 'time';
		order: number;
		onUpdate: (
			target: ProgramWorkoutExerciseTarget,
			executionType: 'reps' | 'time',
			targetSetRange: string,
			targetValue: string
		) => void;
		onRemove: (target: ProgramWorkoutExerciseTarget) => void;
		canRemove: boolean;
	} = $props();

	const targetSetRangeValue = $derived(setTarget.targetSetRange ?? '1');
	const targetRangeValue = $derived(
		executionType === 'reps'
			? (setTarget.targetRepsRange ?? '8')
			: (setTarget.targetDuration ?? '60 sec')
	);
	const targetRangePlaceholder = $derived(
		executionType === 'reps' ? 'e.g. 8 or 10-15' : 'e.g. 45 sec or 30-45 sec'
	);
	const targetRangeLabel = $derived(
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
			oninput={(event) =>
				onUpdate(setTarget, executionType, event.currentTarget.value, targetRangeValue)}
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
			oninput={(event) =>
				onUpdate(setTarget, executionType, targetSetRangeValue, event.currentTarget.value)}
		/>
	</label>
	{#if canRemove}
		<button
			type="button"
			class="text-muted-foreground/30 hover:text-destructive mb-1 ml-auto transition-colors"
			onclick={() => onRemove(setTarget)}
		>
			<XIcon class="size-3.5" />
		</button>
	{/if}
</div>
