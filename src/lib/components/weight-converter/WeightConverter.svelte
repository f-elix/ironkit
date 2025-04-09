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
	import WidgetContainer from '$lib/components/ui/WidgetContainer.svelte';

	let {
		weight = 0,
		unit = 'kg',
		round = false
	}: {
		weight?: number;
		unit?: WeightUnit;
		round?: boolean;
	} = $props();

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

<WidgetContainer>
	<form bind:this={formEl} class="flex flex-col gap-6">
		<div class="flex items-center justify-between gap-2">
			<Field>
				<WeightInput label="Weight" showClearButton bind:value={weight} />
			</Field>
			<Field>
				<UnitSelector bind:value={unit} />
			</Field>
		</div>
		<Field>
			<div class="flex w-full items-center justify-between gap-2">
				<span class="flex items-center gap-1">
					<Label>Round to nearest increment</Label>
					<HintBadge text="Kilos will be rounded to the nearest 2.5 and pounds to the nearest 5." />
				</span>
				<Switch bind:checked={round} />
			</div>
		</Field>
		<div class="mt-4 flex items-center justify-between gap-4">
			<output for={outputIdList} class="flex items-center gap-2 rounded-md text-2xl">
				<span>{result}</span>
				<span>{altUnit}</span>
			</output>
			<CopyOnClick text={result.toString()} />
		</div>
	</form>
</WidgetContainer>
