<script lang="ts">
	import UnitSelector from '$lib/components/ui/UnitSelector.svelte';
	import { getAltUnit, kgToLbs, lbsToKg } from '$lib/weight-units';
	import { Switch } from '$lib/shadcn/switch';
	import HintBadge from '$lib/components/ui/HintBadge.svelte';
	import { roundWeightToNearest } from '$lib/math/roundWeightToNearest';
	import { Label } from '$lib/shadcn/label';
	import LargeWeightInput from '$lib/components/ui/LargeWeightInput.svelte';
	import ToolLayout from '$lib/components/app/ToolLayout.svelte';
	import ResultCopyOnClick from '$lib/components/ui/ResultCopyOnClick.svelte';
	import { DEFAULT_WEIGHT_UNIT } from '$lib/constants';
	import { Account } from '$lib/jazz/schema';
	import { AccountCoState } from 'jazz-tools/svelte';

	const account = new AccountCoState(Account, {
		resolve: {
			root: {
				weightConverter: true
			}
		}
	});

	const weightConverter = $derived(
		account.current.$isLoaded ? account.current.root.weightConverter : null
	);
	const unit = $derived(weightConverter?.unit ?? DEFAULT_WEIGHT_UNIT);
	const round = $derived(weightConverter?.round ?? false);

	let weight = $state<Maybe<number>>();

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

{#if weightConverter}
	<ToolLayout>
		{#snippet output()}
			<ResultCopyOnClick text={result.toString()}>
				<span class="text-4xl">
					{result}
					{altUnit}
				</span>
			</ResultCopyOnClick>
		{/snippet}
		{#snippet input()}
			<LargeWeightInput label="Weight" bind:value={weight} {unit} />
		{/snippet}
		{#snippet settings()}
			<div class="mx-auto flex max-w-80 flex-col gap-4">
				<div class="flex w-full items-center justify-between gap-2">
					<span class="flex items-center gap-1">
						<Label for="round-to-nearest">Round to nearest increment</Label>
						<HintBadge
							text="Kilos will be rounded to the nearest 2.5 and pounds to the nearest 5."
						/>
					</span>
					<Switch
						id="round-to-nearest"
						bind:checked={() => round, (v) => weightConverter.$jazz.set('round', v)}
					/>
				</div>
				<fieldset>
					<legend class="sr-only">Unit</legend>
					<div class="flex items-center justify-between gap-2">
						<div class="text-sm font-medium" aria-hidden="true">Unit</div>
						<UnitSelector bind:value={() => unit, (v) => weightConverter.$jazz.set('unit', v)} />
					</div>
				</fieldset>
			</div>
		{/snippet}
	</ToolLayout>
{/if}
