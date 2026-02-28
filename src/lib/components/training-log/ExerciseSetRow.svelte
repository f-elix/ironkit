<script lang="ts">
	import type { Exercise, PerformanceSet } from '$lib/jazz/types';
	import type { WeightUnit } from '$lib/types';
	import { cn } from '$lib/shadcn/utils';
	import Input from '$lib/shadcn/input/input.svelte';
	import Label from '$lib/shadcn/label/label.svelte';
	import { Textarea } from '$lib/shadcn/textarea';
	import Minus from '@lucide/svelte/icons/minus';
	import Copy from '@lucide/svelte/icons/copy';
	import Check from '@lucide/svelte/icons/check';
	import { tick, untrack } from 'svelte';

	let {
		set,
		setIndex,
		unit,
		exercise,
		previousSet,
		onDelete
	}: {
		set: PerformanceSet;
		setIndex: number;
		unit: WeightUnit;
		exercise: Exercise | null;
		previousSet: PerformanceSet | null;
		onDelete?: () => void;
	} = $props();

	let copied = $state(false);

	const executionType = $derived(exercise?.executionType ?? 'reps');
	const loadType = $derived(exercise?.loadType ?? 'weighted');

	const isCompleted = $derived(
		executionType === 'reps'
			? set.reps != null && set.reps > 0
			: set.durationSeconds != null && set.durationSeconds > 0
	);

	const copyFromPrevious = () => {
		if (!previousSet) {
			return;
		}
		set.$jazz.set('weight', previousSet.weight);
		set.$jazz.set('reps', previousSet.reps);
		set.$jazz.set('durationSeconds', previousSet.durationSeconds);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	};

	const focusIfEmpty = (element: HTMLInputElement) => {
		const isEmpty = untrack(() => !set.weight);
		const hasPreviousSet = untrack(() => previousSet != null);
		const isPreviousSetEmpty = untrack(() => !previousSet?.weight);
		if (isEmpty && (!hasPreviousSet || !isPreviousSetEmpty)) {
			tick().then(() => {
				element.focus();
			});
		}
	};
</script>

<div
	class={cn(
		'focus-within:bg-primary/5 relative flex flex-col gap-2 rounded-lg border p-2 transition-colors',
		isCompleted ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/30 hover:bg-primary/5'
	)}
>
	<!-- Set number indicator -->
	<div
		class={cn(
			'absolute top-2 left-2 flex size-6 items-center justify-center rounded-full font-mono text-xs font-medium',
			isCompleted ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
		)}
	>
		{setIndex + 1}
	</div>

	<div class="flex items-center gap-3 pl-8">
		<!-- Reps/Time input -->
		<Label class="flex flex-1 flex-col gap-1">
			<span class="text-muted-foreground text-xs font-medium">
				{#if executionType === 'reps'}
					Reps
				{:else}
					Time (sec)
				{/if}
			</span>
			<Input
				type="number"
				bind:value={
					() => (executionType === 'reps' ? (set.reps ?? '') : (set.durationSeconds ?? '')),
					(v) => {
						if (executionType === 'reps') {
							set.$jazz.set('reps', v || undefined);
						} else {
							set.$jazz.set('durationSeconds', v || undefined);
						}
					}
				}
				placeholder="0"
				class="h-10 w-full text-center text-base font-semibold tabular-nums"
				inputmode="numeric"
				{@attach focusIfEmpty}
			/>
		</Label>

		<!-- Multiplier -->
		<div class="text-muted-foreground translate-y-1 text-lg" aria-hidden="true">&times;</div>

		<!-- Weight input -->
		<Label class="relative flex flex-1 flex-col gap-1">
			<span class="text-muted-foreground text-xs font-medium">
				{loadType === 'bodyweight' ? `+${unit}` : unit}
			</span>
			<div class="relative">
				{#if loadType === 'bodyweight'}
					<span class="text-muted-foreground absolute top-1/2 left-2 -translate-y-1/2 text-base"
						>+</span
					>
				{/if}
				<Input
					type="text"
					bind:value={
						() => set.weight ?? '',
						(v) => {
							set.$jazz.set('weight', v || undefined);
						}
					}
					placeholder="0"
					class={cn(
						'h-10 w-full text-center text-base font-semibold tabular-nums',
						loadType === 'bodyweight' ? 'pl-6' : ''
					)}
					inputmode="decimal"
				/>
			</div>
		</Label>

		<!-- Action buttons -->
		<div class="flex flex-col gap-1">
			{#if previousSet && setIndex > 0}
				<button
					class="text-muted-foreground hover:bg-muted hover:text-foreground flex h-8 w-8 items-center justify-center rounded-lg transition-all"
					onclick={copyFromPrevious}
					title="Copy from previous set"
				>
					{#if copied}
						<Check class="size-4 text-green-500" />
					{:else}
						<Copy class="size-4" />
					{/if}
				</button>
			{/if}
			{#if onDelete}
				<button
					class="text-muted-foreground hover:bg-destructive/20 hover:text-destructive flex h-8 w-8 items-center justify-center rounded-lg transition-all"
					onclick={onDelete}
					title="Delete set"
				>
					<Minus class="size-4" />
				</button>
			{/if}
		</div>
	</div>

	<!-- Note input -->
	<Label class="pl-8">
		<span class="sr-only">Set note</span>
		<Textarea
			rows={1}
			class="min-h-[2rem] text-sm font-normal"
			placeholder="Note (RIR, RPE, etc.)"
			bind:value={
				() => set.note?.trim() ?? '',
				(v) => {
					set.$jazz.set('note', v);
				}
			}
		/>
	</Label>
</div>
