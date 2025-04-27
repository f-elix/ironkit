<script lang="ts" generics="T extends string">
	import Label from '$lib/shadcn/label/label.svelte';
	import * as RadioGroup from '$lib/shadcn/radio-group';

	type Item = {
		value: T;
		label: string;
	};

	let {
		items,
		label,
		value = $bindable(),
		onValueChange
	}: { items: Item[]; label: string; value: string; onValueChange: (value: T) => void } = $props();
</script>

<fieldset>
	<legend class="sr-only">{label}</legend>
	<RadioGroup.Root
		class="grid grid-cols-2 gap-4"
		bind:value
		onValueChange={onValueChange
			? (v) => {
					onValueChange(v as T);
				}
			: undefined}
	>
		{#each items as { value, label }}
			<Label>
				<RadioGroup.Item {value} class="peer sr-only" />
				<div
					class={[
						'rounded border border-muted py-4 text-center capitalize',
						'transition-colors duration-100 ease-linear',
						'cursor-pointer hover:bg-muted',
						'peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-secondary'
					]}
				>
					{label}
				</div>
			</Label>
		{/each}
	</RadioGroup.Root>
</fieldset>
