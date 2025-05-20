<script lang="ts">
	import { Label } from '$lib/shadcn/label';
	import type { WeightUnit } from '$lib/types';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import XCircle from '@lucide/svelte/icons/circle-x';

	let {
		value = $bindable(),
		label,
		unit = 'kg',
		input = $bindable(),
		id = 'weight',
		...rest
	}: HTMLInputAttributes & {
		label: string;
		value?: number | null;
		input?: Maybe<HTMLInputElement>;
		unit: WeightUnit;
		id?: string;
	} = $props();

	const onClear = () => {
		value = null;
		input?.focus();
	};
</script>

<div
	class={[
		'flex items-center gap-4 px-2',
		'transition-colors duration-150 ease-linear',
		'border-b focus-within:border-foreground focus-within:bg-muted/30 focus-within:outline-hidden'
	]}
>
	<Label for={id} class="sr-only">{label} ({unit})</Label>
	<input
		{id}
		type="number"
		pattern="[0-9]*"
		step="1"
		bind:value
		bind:this={input}
		placeholder="0"
		class={[
			'w-20 bg-transparent px-2 py-4 text-xl font-medium placeholder:text-muted-foreground focus:outline-hidden'
		]}
		{...rest}
	/>
	<span class="text-base" aria-hidden="true">{unit}</span>
	<button
		aria-label="Clear entry"
		tabindex="-1"
		type="button"
		class={[
			'size-6',
			'transition-colors duration-150 ease-linear',
			!value && 'text-muted-foreground/50'
		]}
		onclick={onClear}
	>
		<XCircle size="100%" />
	</button>
</div>
