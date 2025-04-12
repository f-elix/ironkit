<script lang="ts">
	import LargeWeightInput from '$lib/components/ui/LargeWeightInput.svelte';
	import type { WeightUnit } from '$lib/types';

	let weight = $state<Maybe<number>>();
	let unit = $state<WeightUnit>('kg');
</script>

<div>
	<LargeWeightInput label="Weight" id="weight" bind:value={weight} {unit} />
</div>
