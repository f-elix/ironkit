<script lang="ts">
	import { WEIGHT_UNITS, DEFAULT_WEIGHT_UNIT } from '$lib/constants';
	import type { WeightUnit } from '$lib/types';
	import { buttonVariants } from '$lib/shadcn/button';
	import { Label } from '$lib/shadcn/label';

	let {
		value = $bindable(DEFAULT_WEIGHT_UNIT),
		onValueChange
	}: { value: WeightUnit; onValueChange?: (value: WeightUnit) => void } = $props();
</script>

<div class="flex h-10 items-center gap-1 rounded-lg border px-[0.2rem]">
	{#each WEIGHT_UNITS as weightUnit}
		<Label>
			<input
				type="radio"
				value={weightUnit}
				onchange={onValueChange
					? (e) => {
							onValueChange(e.currentTarget.value as WeightUnit);
						}
					: undefined}
				class="peer sr-only"
				bind:group={value}
			/>
			<span
				class="rounded-[0.3rem] border-primary ring-ring ring-offset-2 transition-colors duration-100 ease-linear peer-checked:border peer-checked:bg-accent peer-focus-visible:ring-2 {buttonVariants(
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
