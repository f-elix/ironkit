<script lang="ts">
	import { calculateCoefficient } from '$lib/coefficients/calculateCoefficient';
	import UnitSelector from '$lib/components/ui/UnitSelector.svelte';
	import WeightInput from '$lib/components/ui/WeightInput.svelte';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { GENDER_CLASSES, DEFAULT_WEIGHT_UNIT, DEFAULT_GENDER_CLASS } from '$lib/constants';
	import type { GenderClass, WeightUnit } from '$lib/types';
	import Field from '$lib/components/ui/Field.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import { fly } from 'svelte/transition';
	import { expoOut } from 'svelte/easing';

	let bodyweight = $state<Maybe<number>>();
	let bodyweightUnit = $state<WeightUnit>(DEFAULT_WEIGHT_UNIT);
	let total = $state<Maybe<number>>();
	let totalUnit = $state<WeightUnit>(DEFAULT_WEIGHT_UNIT);
	let genderClass = $state<GenderClass>(DEFAULT_GENDER_CLASS);

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
		class="flex flex-col gap-6 rounded-t-lg bg-muted/30 p-4 pb-6 pt-4"
		in:fly|global={{ duration: 500, easing: expoOut, y: '100%' }}
	>
		<div class="flex items-end justify-between gap-2">
			<Field>
				<WeightInput label="Bodyweight" showLabel showClearButton bind:value={bodyweight} />
			</Field>
			<Field>
				<UnitSelector bind:value={bodyweightUnit} />
			</Field>
		</div>
		<div class="flex items-end justify-between gap-2">
			<Field>
				<WeightInput label="Total" showLabel showClearButton bind:value={total} />
			</Field>
			<Field>
				<UnitSelector bind:value={totalUnit} />
			</Field>
		</div>
		<fieldset>
			<legend class="sr-only">Gender class</legend>
			<RadioGroup.Root class="grid grid-cols-2 gap-4" bind:value={genderClass}>
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
	</form>
	<div class="mb-auto px-4">
		<output
			for={outputIdList}
			class="flex w-full justify-between gap-2 rounded-sm border px-10 py-7"
		>
			{@render coefficientOutput('DOTS', dots)}
			{@render coefficientOutput('GL', gl)}
			{@render coefficientOutput('Wilks', wilks)}
		</output>
	</div>
</div>

{#snippet coefficientOutput(label: string, value: number)}
	<span class="flex flex-col items-center gap-2 text-center text-xl leading-none">
		<span class="text-muted-foreground">{label}</span>
		<span class="font-bold">{value}</span>
	</span>
{/snippet}
