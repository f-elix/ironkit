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
	import { useConvexQuery, useConvexMutation } from '$lib/db/convexHelpers.svelte';
	import { api } from '$convex/_generated/api';

	const query = useConvexQuery(api.weightConverter.get, {});
	const upsertMutation = useConvexMutation(api.weightConverter.upsert);

	let weightConverter = $derived(query.data);
	let unit = $derived(weightConverter?.unit ?? DEFAULT_WEIGHT_UNIT);
	let round = $derived(weightConverter?.round ?? false);

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
					<HintBadge text="Kilos will be rounded to the nearest 2.5 and pounds to the nearest 5." />
				</span>
				<Switch
					id="round-to-nearest"
					checked={round}
					onCheckedChange={(v) => {
						upsertMutation.mutate({
							unit,
							round: v
						});
					}}
				/>
			</div>
			<fieldset>
				<div class="flex items-center justify-between gap-2">
					<legend class="text-sm font-medium">Unit</legend>
					<UnitSelector
						value={unit}
						onValueChange={(v) => {
							upsertMutation.mutate({
								unit: v,
								round
							});
						}}
					/>
				</div>
			</fieldset>
		</div>
	{/snippet}
</ToolLayout>
