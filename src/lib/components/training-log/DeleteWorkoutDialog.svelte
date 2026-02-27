<script lang="ts">
	import { Button, buttonVariants } from '$lib/shadcn/button';
	import * as Dialog from '$lib/shadcn/dialog';
	import TrashIcon from '@lucide/svelte/icons/trash-2';

	let {
		onConfirmDelete
	}: {
		onConfirmDelete?: () => Promise<void> | void;
	} = $props();

	let open = $state(false);

	const onDelete = async () => {
		if (onConfirmDelete) {
			onConfirmDelete();
			open = false;
			return;
		}
	};
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger
		class={buttonVariants({
			variant: 'ghost',
			size: 'sm',
			class: 'text-destructive hover:text-destructive h-7 text-xs'
		})}
	>
		<TrashIcon class="size-3.5" />
		Delete workout
	</Dialog.Trigger>
	<Dialog.Content>
		<Dialog.Title>Delete workout</Dialog.Title>
		<Dialog.Description>
			Are you sure you want to delete this workout? This action cannot be undone.
		</Dialog.Description>
		<Dialog.Footer class="flex flex-row justify-end gap-2">
			<Dialog.Close class={buttonVariants({ variant: 'secondary' })}>Cancel</Dialog.Close>
			<Button variant="destructive" onclick={onDelete}>Delete workout</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
