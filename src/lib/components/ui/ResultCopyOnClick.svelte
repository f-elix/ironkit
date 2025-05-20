<script lang="ts">
	import CopyOnClick from '$lib/components/ui/CopyOnClick.svelte';
	import CheckIcon from '@lucide/svelte/icons/check';
	import type { Snippet } from 'svelte';

	let { text, children: childrenProp }: { text: string; children: Snippet<[{ copied: boolean }]> } =
		$props();
</script>

<CopyOnClick
	{text}
	class="sticky top-0 mx-auto flex h-auto min-w-60 flex-col items-center gap-2 px-10 py-7"
	variant="outline"
>
	{#snippet children({ copied })}
		{@render childrenProp({ copied })}
		<span class="text-muted-foreground/70 flex items-center gap-2">
			{#if copied}
				Copied
				<CheckIcon class="size-4" />
			{:else}
				<span class="pointer:inline hidden">Click to copy</span>
				<span class="touch:inline hidden">Tap to copy</span>
			{/if}
		</span>
	{/snippet}
</CopyOnClick>
