<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import XCircle from '@lucide/svelte/icons/circle-x';
	import type { Snippet } from 'svelte';
	import Label from '$lib/components/ui/label/label.svelte';

	let {
		value = $bindable(),
		label,
		showLabel = false,
		showClearButton = false,
		input = $bindable(null),
		children
	}: {
		label: string;
		showLabel?: boolean;
		showClearButton?: boolean;
		value?: number | null;
		input?: Maybe<HTMLInputElement>;
		children?: Snippet;
	} = $props();

	const onClear = () => {
		value = null;
		input?.focus();
	};

	const onFocus = () => {
		input?.select();
	};
</script>

<div class="flex flex-col gap-2">
	<Label class={showLabel ? 'text-sm' : 'sr-only'}>{label}</Label>
	<div class="flex items-center gap-2">
		<div class="relative w-24">
			<Input
				type="number"
				pattern="[0-9]*"
				step="1"
				bind:value
				bind:ref={input}
				onfocus={onFocus}
			/>
			{#if showClearButton}
				<button
					type="button"
					class="pointer:hidden absolute right-2 top-1/2 -translate-y-1/2"
					aria-label="Clear"
					onclick={onClear}
				>
					<XCircle size="16" />
				</button>
			{/if}
		</div>
		{#if children}
			{@render children()}
		{/if}
	</div>
</div>
