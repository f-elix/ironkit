<script lang="ts">
	import { pushState } from '$app/navigation';
	import { resolve } from '$app/paths';

	import type { Tool } from '$lib/data/tools';
	import { isDesktop } from '$lib/isDesktop.svelte';
	import Button from '$lib/shadcn/button/button.svelte';

	let { href, title, Icon }: Tool = $props();

	const onclick = (e: Event) => {
		if (!isDesktop.current || href === resolve('/(app)/tools/training-log')) {
			return;
		}
		e.preventDefault();
		pushState('', {
			toolHref: href
		});
	};
</script>

<Button
	variant="secondary"
	size="lg"
	class="aspect-[4/3] h-auto w-full flex-col items-center border bg-gray-900 px-2 text-center whitespace-normal lg:text-xl"
	{href}
	{onclick}
>
	<Icon class="lg:size-8" />
	<span>{title}</span>
</Button>
