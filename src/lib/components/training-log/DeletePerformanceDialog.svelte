<script lang="ts">
	import * as Dialog from '$lib/shadcn/dialog';
	import { buttonVariants } from '$lib/shadcn/button';
	import TrashIcon from '@lucide/svelte/icons/trash-2';

	let { onConfirm }: { onConfirm: () => void } = $props();
</script>

<Dialog.Root>
	<Dialog.Trigger
		class={buttonVariants({
			variant: 'destructive',
			size: 'icon',
			class: 'size-6'
		})}
		aria-label="Remove exercise"
	>
		<TrashIcon class="size-3" />
	</Dialog.Trigger>
	<Dialog.Content>
		<Dialog.Title>Delete exercise</Dialog.Title>
		<Dialog.Description>Are you sure you want to delete this exercise?</Dialog.Description>
		<Dialog.Footer class="flex flex-row justify-end gap-2">
			<Dialog.Close class={buttonVariants({ variant: 'secondary' })}>Cancel</Dialog.Close>
			<Dialog.Close class={buttonVariants({ variant: 'destructive' })} onclick={onConfirm}>
				Confirm
			</Dialog.Close>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
