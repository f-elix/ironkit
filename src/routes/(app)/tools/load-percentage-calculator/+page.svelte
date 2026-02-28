<script lang="ts">
	import ToolLayout from '$lib/components/app/ToolLayout.svelte';
	import LargeWeightInput from '$lib/components/ui/LargeWeightInput.svelte';
	import ResultCopyOnClick from '$lib/components/ui/ResultCopyOnClick.svelte';
	import { Label } from '$lib/shadcn/label';
	import { Switch } from '$lib/shadcn/switch';
	import HintBadge from '$lib/components/ui/HintBadge.svelte';
	import { Slider } from '$lib/shadcn/slider';
	import UnitSelector from '$lib/components/ui/UnitSelector.svelte';
	import { roundWeightToNearest } from '$lib/math/roundWeightToNearest';
	import { DEFAULT_WEIGHT_UNIT } from '$lib/constants';
import { IronkitAccount } from '$lib/jazz/schema';
import { AccountCoState } from 'jazz-tools/svelte';

const account = new AccountCoState(IronkitAccount, {
		resolve: {
			root: {
				loadPercentageCalculator: true
			}
		}
	});

	const loadPercentageCalculator = $derived(
		account.current.$isLoaded ? account.current.root.loadPercentageCalculator : null
	);
	const unit = $derived(loadPercentageCalculator?.unit ?? DEFAULT_WEIGHT_UNIT);
	const round = $derived(loadPercentageCalculator?.round ?? false);

	let oneRepMax = $state<Maybe<number>>();
	let percentage = $state<number>(60);

	let currentWeight = $derived.by(() => {
		if (!oneRepMax) {
			return 0;
		}
		const result = oneRepMax * (percentage / 100);
		if (!round) {
			return Math.floor(result);
		}
		if (unit === 'kg') {
			return roundWeightToNearest(result, 2.5);
		}
		return roundWeightToNearest(result, 5);
	});
</script>

{#if loadPercentageCalculator}
	<ToolLayout>
		{#snippet output()}
			<div class="flex flex-col gap-4">
				<ResultCopyOnClick text={currentWeight.toString()}>
					<span class="text-4xl tabular-nums">
						{currentWeight}
						{unit}
					</span>
				</ResultCopyOnClick>
				<div class="text-center text-3xl tabular-nums">
					{percentage}%
				</div>
			</div>
		{/snippet}
		{#snippet input()}
			<LargeWeightInput label="One rep max" bind:value={oneRepMax} {unit} />
		{/snippet}
		{#snippet settings()}
			<div class="mx-auto flex max-w-80 flex-col gap-4">
				<div class="flex flex-col gap-4">
					<Label>Percentage</Label>
					<Slider type="single" bind:value={percentage} min={30} max={110} step={2.5} />
				</div>
				<div class="mt-6 flex w-full items-center justify-between gap-2">
					<span class="flex items-center gap-1">
						<Label for="round-to-nearest">Round to nearest increment</Label>
						<HintBadge
							text="Kilos will be rounded to the nearest 2.5 and pounds to the nearest 5."
						/>
					</span>
					<Switch
						id="round-to-nearest"
						bind:checked={() => round, (v) => loadPercentageCalculator.$jazz.set('round', v)}
					/>
				</div>
				<fieldset>
					<div class="flex items-center justify-between gap-2">
						<legend class="text-sm font-medium">Unit</legend>
						<UnitSelector
							bind:value={() => unit, (v) => loadPercentageCalculator.$jazz.set('unit', v)}
						/>
					</div>
				</fieldset>
			</div>
		{/snippet}
	</ToolLayout>
{/if}
