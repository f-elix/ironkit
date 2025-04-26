<script lang="ts">
	import { calculateCoefficient } from '$lib/coefficients/calculateCoefficient';
	import UnitSelector from '$lib/components/ui/UnitSelector.svelte';
	import DefaultNumberInput from '$lib/components/ui/DefaultNumberInput.svelte';
	import { DEFAULT_WEIGHT_UNIT, DEFAULT_GENDER_CLASS, GENDER_CLASSES } from '$lib/constants';
	import { Label } from '$lib/shadcn/label';
	import ToolLayout from '$lib/components/app/ToolLayout.svelte';
	import { useQuery } from '@triplit/svelte';
	import { triplit } from '$lib/db/triplit';
	import type { GenderClass } from '$lib/types';
	import LargeRadioButtons from '$lib/components/ui/LargeRadioButtons.svelte';

	const query = useQuery(triplit, triplit.query('coefficientCalculator'));
	let coefficientCalculator = $derived(query.results?.[0]);
	let bodyweightUnit = $derived(coefficientCalculator?.bodyweightUnit ?? DEFAULT_WEIGHT_UNIT);
	let totalUnit = $derived(coefficientCalculator?.totalUnit ?? DEFAULT_WEIGHT_UNIT);
	let genderClass = $derived(coefficientCalculator?.genderClass ?? DEFAULT_GENDER_CLASS);

	let total = $state<Maybe<number>>();
	let bodyweight = $state<Maybe<number>>();

	let wilks = $derived(
		calculateCoefficient({
			coeffecientType: 'Wilks',
			bodyweight: bodyweight ?? 0,
			bodyweightUnit: bodyweightUnit ?? 'kg',
			total: total ?? 0,
			totalUnit: totalUnit ?? 'kg',
			genderClass: genderClass ?? 'male'
		})
	);
	let dots = $derived(
		calculateCoefficient({
			coeffecientType: 'Dots',
			bodyweight: bodyweight ?? 0,
			bodyweightUnit: bodyweightUnit ?? 'kg',
			total: total ?? 0,
			totalUnit: totalUnit ?? 'kg',
			genderClass: genderClass ?? 'male'
		})
	);
	let gl = $derived(
		calculateCoefficient({
			coeffecientType: 'GL',
			bodyweight: bodyweight ?? 0,
			bodyweightUnit: bodyweightUnit ?? 'kg',
			total: total ?? 0,
			totalUnit: totalUnit ?? 'kg',
			genderClass: genderClass ?? 'male'
		})
	);
</script>

<ToolLayout>
	{#snippet output()}
		<div class="flex justify-between gap-2 rounded-sm border px-10 py-7">
			{@render coefficientOutput('DOTS', dots)}
			{@render coefficientOutput('GL', gl)}
			{@render coefficientOutput('Wilks', wilks)}
		</div>
	{/snippet}
	{#snippet settings()}
		<div class="flex flex-col gap-6">
			<div class="grid grid-cols-[1.5fr_1fr_auto] items-center gap-2">
				<Label class="col-span-2 grid grid-cols-subgrid items-center gap-2">
					Total
					<DefaultNumberInput showClearButton bind:value={total} />
				</Label>
				<UnitSelector
					value={totalUnit}
					onValueChange={(v) => {
						triplit.insert('coefficientCalculator', {
							...coefficientCalculator,
							totalUnit: v
						});
					}}
				/>
				<Label class="col-span-2 grid grid-cols-subgrid items-center gap-2">
					Bodyweight
					<DefaultNumberInput showClearButton bind:value={bodyweight} />
				</Label>
				<UnitSelector
					value={bodyweightUnit}
					onValueChange={(v) => {
						triplit.insert('coefficientCalculator', {
							...coefficientCalculator,
							bodyweightUnit: v
						});
					}}
				/>
			</div>
			<LargeRadioButtons
				label="Gender class"
				items={GENDER_CLASSES.map((genderClass) => ({
					value: genderClass,
					label: genderClass
				}))}
				value={genderClass}
				onValueChange={(v) => {
					triplit.insert('coefficientCalculator', {
						...coefficientCalculator,
						genderClass: v as GenderClass
					});
				}}
			/>
		</div>
	{/snippet}
</ToolLayout>

{#snippet coefficientOutput(label: string, value: number)}
	<span class="flex flex-col items-center gap-2 text-center text-xl leading-none">
		<span class="text-muted-foreground">{label}</span>
		<span class="font-bold">{value}</span>
	</span>
{/snippet}
