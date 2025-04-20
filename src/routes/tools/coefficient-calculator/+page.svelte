<script lang="ts">
	import { calculateCoefficient } from '$lib/coefficients/calculateCoefficient';
	import UnitSelector from '$lib/components/ui/UnitSelector.svelte';
	import DefaultNumberInput from '$lib/components/ui/DefaultNumberInput.svelte';
	import * as RadioGroup from '$lib/shadcn/radio-group';
	import { DEFAULT_WEIGHT_UNIT, DEFAULT_GENDER_CLASS, GENDER_CLASSES } from '$lib/constants';
	import { Label } from '$lib/shadcn/label';
	import ToolLayout from '$lib/components/app/ToolLayout.svelte';
	import { useQuery } from '@triplit/svelte';
	import { triplit } from '$lib/db/triplit';
	import type { GenderClass } from '$lib/types';

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
			<fieldset>
				<legend class="sr-only">Gender class</legend>
				<RadioGroup.Root
					class="grid grid-cols-2 gap-4"
					value={genderClass}
					onValueChange={(v) => {
						triplit.insert('coefficientCalculator', {
							...coefficientCalculator,
							genderClass: v as GenderClass
						});
					}}
				>
					{#each GENDER_CLASSES as genderClassOption}
						<Label>
							<RadioGroup.Item value={genderClassOption} class="peer sr-only" />
							<div
								class={[
									'rounded border border-muted py-4 text-center capitalize',
									'transition-colors duration-100 ease-linear',
									'cursor-pointer hover:bg-muted',
									'peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-secondary'
								]}
							>
								{genderClassOption}
							</div>
						</Label>
					{/each}
				</RadioGroup.Root>
			</fieldset>
		</div>
	{/snippet}
</ToolLayout>

{#snippet coefficientOutput(label: string, value: number)}
	<span class="flex flex-col items-center gap-2 text-center text-xl leading-none">
		<span class="text-muted-foreground">{label}</span>
		<span class="font-bold">{value}</span>
	</span>
{/snippet}
