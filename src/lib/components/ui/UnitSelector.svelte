<script lang="ts">
	import { WEIGHT_UNITS, DEFAULT_WEIGHT_UNIT } from '$lib/constants';
	import type { WeightUnit } from '$lib/types';
	import { buttonVariants } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import type { HTMLInputAttributes } from 'svelte/elements';

	let {
		value = $bindable(DEFAULT_WEIGHT_UNIT),
		onchange
	}: { value: WeightUnit; onchange?: HTMLInputAttributes['onchange'] } = $props();
</script>

<div class="flex items-center gap-1 rounded-lg border p-1">
	{#each WEIGHT_UNITS as weightUnit}
		<Label>
			<input type="radio" value={weightUnit} {onchange} class="peer sr-only" bind:group={value} />
			<span
				class="border-primary ring-ring ring-offset-2 peer-checked:border peer-checked:bg-accent peer-focus-visible:ring-2 {buttonVariants(
					{
						variant: 'ghost',
						size: 'sm',
						class: 'h-8 w-10 cursor-pointer p-1 capitalize'
					}
				)}"
			>
				{weightUnit}
			</span>
		</Label>
	{/each}
</div>
