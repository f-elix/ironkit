<script lang="ts">
	import { Accordion } from 'bits-ui';
	import { buttonVariants } from '$lib/shadcn/button';
	import XIcon from '@lucide/svelte/icons/x';

	let { size = 'default' }: { size?: 'sm' | 'default' } = $props();
</script>

<Accordion.Trigger
	class={buttonVariants({
		variant: 'outline',
		size: 'icon',
		class: size === 'sm' && 'size-6'
	})}
>
	<XIcon class={size === 'sm' ? 'size-3' : 'size-4'} />
</Accordion.Trigger>
