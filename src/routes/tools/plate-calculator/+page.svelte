<script lang="ts">
	import KgPlatesConfiguration from '$lib/components/plate-calculator/KgPlatesConfiguration.svelte';
	import HintBadge from '$lib/components/ui/HintBadge.svelte';
	import Switch from '$lib/components/ui/switch/switch.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import { fly } from 'svelte/transition';
	import { expoOut } from 'svelte/easing';
	import LargeWeightInput from '$lib/components/ui/LargeWeightInput.svelte';
	import KgPlatesRepresentation from '$lib/components/plate-calculator/KgPlatesRepresentation.svelte';
	import {
		getActualBarWeight,
		kgPlateConfigurationWeight,
		MAX_WEIGHT,
		weightToKgPlatesConfiguration,
		type BarWeight
	} from '$lib/components/plate-calculator/plateCalculator';

	let weight = $state<Maybe<number>>();
	let heavyCollars = $state(false);
	let barWeight = $state<BarWeight>(20);

	let kgPlateConfiguration = $derived(
		weightToKgPlatesConfiguration(weight, {
			barWeight,
			heavyCollars
		})
	);

	let errorMessage = $derived.by(() => {
		const actualBarWeight = getActualBarWeight({ barWeight: 20, heavyCollars });
		if (weight === 0 || !weight || isNaN(weight)) {
			return 'Enter a weight';
		} else if (weight > MAX_WEIGHT) {
			return `Maximum weight is ${MAX_WEIGHT}kg`;
		} else if (weight < actualBarWeight) {
			return `Minimum weight is ${actualBarWeight}kg`;
		} else if (!kgPlateConfiguration?.length) {
			return 'Invalid weight';
		}
		return null;
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
	<form bind:this={formEl} class="flex flex-col gap-16">
		<div class="self-center">
			<LargeWeightInput
				label="Weight"
				value={weight}
				unit="kg"
				oninput={(e) => {
					weight = e.currentTarget.valueAsNumber;
				}}
			/>
		</div>
		<div
			class="rounded-t-lg bg-muted/30 px-4 py-8"
			in:fly|global={{ duration: 500, easing: expoOut, y: '100%' }}
		>
			<Field>
				<div class="flex w-full items-center justify-between gap-2">
					<span class="flex items-center gap-1">
						<Label>With competition collars</Label>
						<HintBadge
							text="Competition collars weight 2.5kg each (5kg total), so using them will alter the plate configuration."
						/>
					</span>
					<Switch bind:checked={heavyCollars} />
				</div>
			</Field>
		</div>
	</form>
	<div class="flex grow flex-col justify-center gap-8 p-4">
		<output for={outputIdList}>
			<div
				class="flex min-h-60 flex-col place-items-center items-center justify-center gap-6 overflow-hidden rounded-lg border bg-secondary p-4"
			>
				{#if kgPlateConfiguration?.length > 0}
					<KgPlatesRepresentation {kgPlateConfiguration} {heavyCollars} />
				{:else if errorMessage}
					<p class="text-center text-muted-foreground">
						{errorMessage}
					</p>
				{/if}
			</div>
		</output>
		<KgPlatesConfiguration
			{kgPlateConfiguration}
			onConfigurationChange={(newConfig) => {
				weight =
					kgPlateConfigurationWeight(newConfig) + getActualBarWeight({ barWeight, heavyCollars });
			}}
		/>
	</div>
</div>
