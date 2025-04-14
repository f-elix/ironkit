<script lang="ts">
	import { calculateCoefficient } from '$lib/coefficients/calculateCoefficient';
	import UnitSelector from '$lib/components/ui/UnitSelector.svelte';
	import DefaultNumberInput from '$lib/components/ui/DefaultNumberInput.svelte';
	import * as RadioGroup from '$lib/shadcn/radio-group';
	import { GENDER_CLASSES } from '$lib/constants';
	import { Label } from '$lib/shadcn/label';
	import ToolLayout from '$lib/components/app/ToolLayout.svelte';
	import { coefficientCalculator$ } from '$lib/db/coefficientCalculator$';
	import { use$ } from 'legend-svelte';

	let bodyweight = $state<Maybe<number>>();
	let coefficientCalculator = use$(coefficientCalculator$);
	let bodyweightUnit = $derived(coefficientCalculator.current.bodyweightUnit);
	let total = $state<Maybe<number>>();
	let totalUnit = $derived(coefficientCalculator.current.totalUnit);
	let genderClass = $derived(coefficientCalculator.current.genderClass);

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
					bind:value={() => totalUnit, (v) => coefficientCalculator$.totalUnit.set(v)}
				/>
				<Label class="col-span-2 grid grid-cols-subgrid items-center gap-2">
					Bodyweight
					<DefaultNumberInput showClearButton bind:value={bodyweight} />
				</Label>
				<UnitSelector
					bind:value={() => bodyweightUnit, (v) => coefficientCalculator$.bodyweightUnit.set(v)}
				/>
			</div>
			<fieldset>
				<legend class="sr-only">Gender class</legend>
				<RadioGroup.Root
					class="grid grid-cols-2 gap-4"
					bind:value={() => genderClass, (v) => coefficientCalculator$.genderClass.set(v)}
				>
					{#each GENDER_CLASSES as genderClassOption}
						<Label>
							<RadioGroup.Item value={genderClassOption} class="peer sr-only" />
							<div
								class={[
									'rounded border border-muted py-4 text-center capitalize',
									'transition-colors duration-100 ease-linear',
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
