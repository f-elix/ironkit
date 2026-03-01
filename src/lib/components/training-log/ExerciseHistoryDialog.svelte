<script lang="ts">
	import { buttonVariants } from '$lib/shadcn/button/button.svelte';
	import * as Dialog from '$lib/shadcn/dialog';
	import History from '@lucide/svelte/icons/history';
	import PastPerformancesList from '$lib/components/training-log/PastPerformancesList.svelte';

	let { exerciseId }: { exerciseId: string } = $props();
</script>

<Dialog.Root>
	<Dialog.Trigger
		class={buttonVariants({ variant: 'secondary', size: 'icon', class: 'text-primary' })}
		aria-label="View exercise history"
	>
		<History />
	</Dialog.Trigger>
	<Dialog.Content class="p-5 pb-0">
		<Dialog.Title>Exercise history</Dialog.Title>
		<PastPerformancesList {exerciseId} />
	</Dialog.Content>
</Dialog.Root>
