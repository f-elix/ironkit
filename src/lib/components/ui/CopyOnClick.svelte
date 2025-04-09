<script lang="ts">
	import { copyToClipboard } from '@svelte-put/copy';
	import ClipboardIcon from '@lucide/svelte/icons/clipboard';
	import ClipboardCheckIcon from '@lucide/svelte/icons/clipboard-check';

	let { text }: { text: string } = $props();

	let copied = $state(false);

	const onClick = () => {
		copyToClipboard(text);
		copied = true;
		setTimeout(() => {
			copied = false;
		}, 3000);
	};

	const iconSize = 20;
</script>

<button
	class="text-muted-foreground hover:text-foreground"
	aria-label={copied ? 'Copy' : 'Copied'}
	onclick={onClick}
>
	{#if copied}
		<ClipboardCheckIcon size={iconSize} />
	{:else}
		<ClipboardIcon size={iconSize} />
	{/if}
</button>
