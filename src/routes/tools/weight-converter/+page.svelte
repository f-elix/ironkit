<script lang="ts">
	import UnitSelector from '$lib/components/ui/UnitSelector.svelte';
	import WeightInput from '$lib/components/ui/WeightInput.svelte';
	import { getAltUnit, kgToLbs, lbsToKg } from '$lib/weight-units';
	import { Switch } from '$lib/components/ui/switch';
	import CopyOnClick from '$lib/components/ui/CopyOnClick.svelte';
	import HintBadge from '$lib/components/ui/HintBadge.svelte';
	import { roundWeightToNearest } from '$lib/math/roundWeightToNearest';
	import type { WeightUnit } from '$lib/types';
	import Field from '$lib/components/ui/Field.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import CheckIcon from '@lucide/svelte/icons/check';
	import { fly } from 'svelte/transition';
	import { expoOut } from 'svelte/easing';

	let weight = $state(0);
	let unit = $state<WeightUnit>('kg');
	let round = $state(false);

	let altUnit = $derived(getAltUnit(unit));
	let result = $derived.by(() => {
		const convertedValue = unit === 'kg' ? kgToLbs(weight) : lbsToKg(weight);
		if (!round) {
			return convertedValue;
		}
		const factor = altUnit === 'kg' ? 2.5 : 5;
		return roundWeightToNearest(convertedValue, factor);
	});

	let formEl = $state<HTMLFormElement>();
	let outputIdList = $derived(
		formEl
			? Array.from(formEl.elements)
					.map((el) => el.id)
					.join(' ')
			: ''
	);
</script>

<div class="flex grow flex-col-reverse">
	<form
		bind:this={formEl}
		class="flex flex-col gap-6 rounded-t-lg bg-muted/30 p-4 pt-8"
		in:fly|global={{ duration: 500, easing: expoOut, y: '100%' }}
	>
		<Field>
			<div class="flex w-full items-center justify-between gap-2">
				<span class="flex items-center gap-1">
					<Label>Round to nearest increment</Label>
					<HintBadge text="Kilos will be rounded to the nearest 2.5 and pounds to the nearest 5." />
				</span>
				<Switch bind:checked={round} />
			</div>
		</Field>
		<div class="flex items-center justify-between gap-2">
			<Field>
				<WeightInput label="Weight" showClearButton bind:value={weight} />
			</Field>
			<Field>
				<UnitSelector bind:value={unit} />
			</Field>
		</div>
	</form>
	<div class="flex grow items-center justify-center p-4">
		<CopyOnClick
			text={result.toString()}
			class="flex h-auto flex-col items-center gap-2 px-10 py-7"
			variant="outline"
		>
			{#snippet children({ copied })}
				<output for={outputIdList} class="flex items-center gap-2 rounded-md text-4xl">
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
</div>
