<script lang="ts">
	import KgPlatesConfiguration from '$lib/components/plate-calculator/KgPlatesConfiguration.svelte';
	import HintBadge from '$lib/components/ui/HintBadge.svelte';
	import Switch from '$lib/components/ui/switch/switch.svelte';
	import WeightInput from '$lib/components/ui/WeightInput.svelte';
	import { Debounced } from 'runed';
	import Field from '$lib/components/ui/Field.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import { fly } from 'svelte/transition';
	import { expoOut } from 'svelte/easing';

	let titleEl = $state<HTMLElement>();
	let weight = $state(0);
	let heavyCollars = $state(false);
	let editableWeight = $state(true);

	let debouncedWeight = new Debounced(() => weight, 200);

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
		class="flex flex-col-reverse gap-6 rounded-t-lg bg-muted/30 p-4 pt-8"
		in:fly|global={{ duration: 500, easing: expoOut, y: '100%' }}
	>
		<div class="flex items-end gap-2">
			{#if editableWeight}
				<Field>
					<WeightInput label="Weight" showClearButton bind:value={weight}>Kg</WeightInput>
				</Field>
			{:else}
				<h3 tabindex="-1" class="text-lg font-medium" bind:this={titleEl}>{weight}kg</h3>
			{/if}
		</div>
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
	</form>
	<div class="flex grow items-center justify-center p-4">
		<output for={outputIdList} class="w-full">
			<KgPlatesConfiguration weight={debouncedWeight.current} {heavyCollars} />
		</output>
	</div>
</div>
