<script lang="ts">
	import WorkoutInfoDialog from '$lib/components/training-log/WorkoutInfoDialog.svelte';
	import { Button, type ButtonVariant, type ButtonSize } from '$lib/shadcn/button';
	import { PlusIcon } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	let {
		variant = 'default' as ButtonVariant,
		size = 'lg' as ButtonSize,
		class: className,
		children
	}: {
		variant?: ButtonVariant;
		size?: ButtonSize;
		class?: string;
		children?: Snippet;
	} = $props();
</script>

<WorkoutInfoDialog>
	{#snippet trigger({ props })}
		<Button {...props} {variant} {size} class={className}>
			{#if children}
				{@render children()}
			{:else}
				<PlusIcon />
				New workout
			{/if}
		</Button>
	{/snippet}
</WorkoutInfoDialog>
