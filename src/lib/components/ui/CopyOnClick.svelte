<script lang="ts">
	import type { Snippet } from 'svelte';
	import { copyToClipboard } from '@svelte-put/copy';
	import type { ComponentProps } from 'svelte';
	import Button from '$lib/components/ui/button/button.svelte';

	let {
		text,
		children,
		...rest
	}: Omit<ComponentProps<typeof Button>, 'children'> & {
		text: string;
		children?: Snippet<[{ copied: boolean }]>;
	} = $props();

	let copied = $state(false);

	const onClick = () => {
		copyToClipboard(text);
		copied = true;
		setTimeout(() => {
			copied = false;
		}, 3000);
	};
</script>

<Button onclick={onClick} {...rest}>
	{@render children?.({ copied })}
</Button>
