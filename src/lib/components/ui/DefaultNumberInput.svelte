<script lang="ts">
	import { Input } from '$lib/shadcn/input';
	import XCircle from '@lucide/svelte/icons/circle-x';

	let {
		value = $bindable(),
		showClearButton = false,
		input = $bindable(null)
	}: {
		showClearButton?: boolean;
		value?: number | null;
		input?: Maybe<HTMLInputElement>;
	} = $props();

	const onClear = () => {
		value = null;
		input?.focus();
	};
</script>

<div class="relative">
	<Input type="number" pattern="[0-9]*" step="1" bind:value bind:ref={input} placeholder="0" />
	{#if showClearButton}
		<button
			type="button"
			class={[
				'absolute right-2 top-1/2 -translate-y-1/2',
				'transition-colors duration-150 ease-linear',
				!value && 'text-muted-foreground/50'
			]}
			aria-label="Clear entry"
			tabindex="-1"
			onclick={onClear}
		>
			<XCircle size="16" />
		</button>
	{/if}
</div>
