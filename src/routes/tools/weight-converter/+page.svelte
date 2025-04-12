<script lang="ts">
	import UnitSelector from '$lib/components/ui/UnitSelector.svelte';
	import { getAltUnit, kgToLbs, lbsToKg } from '$lib/weight-units';
	import { Switch } from '$lib/components/ui/switch';
	import CopyOnClick from '$lib/components/ui/CopyOnClick.svelte';
	import HintBadge from '$lib/components/ui/HintBadge.svelte';
	import { roundWeightToNearest } from '$lib/math/roundWeightToNearest';
	import type { WeightUnit } from '$lib/types';
	import Label from '$lib/components/ui/label/label.svelte';
	import CheckIcon from '@lucide/svelte/icons/check';
	import { fly } from 'svelte/transition';
	import { expoOut } from 'svelte/easing';
	import LargeWeightInput from '$lib/components/ui/LargeWeightInput.svelte';

	let weight = $state<Maybe<number>>();
	let unit = $state<WeightUnit>('kg');
	let round = $state(false);

	let altUnit = $derived(getAltUnit(unit));
	let result = $derived.by(() => {
		if (!weight) {
			return 0;
		}
		const convertedValue = unit === 'kg' ? kgToLbs(weight) : lbsToKg(weight);
		if (!round) {
			return convertedValue;
		}
		const factor = altUnit === 'kg' ? 2.5 : 5;
		return roundWeightToNearest(convertedValue, factor);
	});
</script>

<div class="flex grow flex-col">
	<div class="px-4 pb-2">
		<CopyOnClick
			text={result.toString()}
			class="sticky top-0 mx-auto flex h-auto flex-col items-center gap-2 px-10 py-7"
			variant="outline"
		>
			{#snippet children({ copied })}
				<output for="weight" class="flex items-center gap-2 rounded-md text-4xl">
					<span>{result}</span>
					<span>{altUnit}</span>
				</output>
				<span class="flex items-center gap-2 text-muted-foreground/70">
					{#if copied}
						Copied
						<CheckIcon class="size-4" />
					{:else}
						Click to copy
					{/if}
				</span>
			{/snippet}
		</CopyOnClick>
	</div>
	<div class="mt-auto flex flex-col items-center gap-8">
		<LargeWeightInput label="Weight" id="weight" bind:value={weight} {unit} />
		<div
			class="self-stretch rounded-t-lg bg-muted/30 px-4 pb-6 pt-4"
			in:fly|global={{ duration: 500, easing: expoOut, y: '100%' }}
		>
			<div class="mx-auto flex max-w-80 flex-col gap-4">
				<div class="flex w-full items-center justify-between gap-2">
					<span class="flex items-center gap-1">
						<Label for="round">Round to nearest increment</Label>
						<HintBadge
							text="Kilos will be rounded to the nearest 2.5 and pounds to the nearest 5."
						/>
					</span>
					<Switch id="round" bind:checked={round} />
				</div>
				<fieldset>
					<div class="flex items-center justify-between gap-2">
						<legend class="text-sm font-medium">Unit</legend>
						<UnitSelector bind:value={unit} />
					</div>
				</fieldset>
			</div>
		</div>
	</div>
</div>
