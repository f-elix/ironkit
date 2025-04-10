<script lang="ts">
	import type { IconProps } from '@lucide/svelte';
	import DumbbellIcon from '@lucide/svelte/icons/dumbbell';

	let props: IconProps = $props();
</script>

<DumbbellIcon {...props} class={['-rotate-45', props.class]} size={20} />
