<script lang="ts">
	import Label from '$lib/components/ui/label/label.svelte';
	import type { WeightUnit } from '$lib/types';
	import type { HTMLInputAttributes } from 'svelte/elements';

	let {
		value = $bindable(),
		label,
		unit = 'kg',
		input = $bindable(),
		...rest
	}: HTMLInputAttributes & {
		label: string;
		value?: number | null;
		input?: Maybe<HTMLInputElement>;
		unit: WeightUnit;
	} = $props();

	const onFocus = () => {
		input?.select();
	};
</script>

<div class="flex items-baseline gap-2">
	<Label class="sr-only">{label}</Label>
	<input
		type="number"
		pattern="[0-9]*"
		step="1"
		bind:value
		bind:this={input}
		onfocus={onFocus}
		placeholder="0"
		class={[
			'w-32 border-b bg-transparent px-2 py-4 text-center text-xl font-medium placeholder:text-muted-foreground',
			'transition-colors duration-150 ease-linear',
			'focus:border-foreground focus:bg-muted/30 focus:outline-none'
		]}
		{...rest}
	/>
	<span class="text-xl">{unit}</span>
</div>
