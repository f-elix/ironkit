<script lang="ts">
	import type { Exercise } from '$lib/db/types';
	import * as Dialog from '$lib/shadcn/dialog';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import { Button, buttonVariants } from '$lib/shadcn/button';
	import { triplit } from '$lib/db/triplit';

	let { exercise }: { exercise: Exercise } = $props();

	const onDelete = async () => {
		await triplit.delete('exercises', exercise.id);
	};
</script>

<Dialog.Root>
	<Dialog.Trigger
		class={buttonVariants({ variant: 'destructive', size: 'icon' })}
		aria-label="Delete exercise"
	>
		<TrashIcon />
	</Dialog.Trigger>
	<Dialog.Content class="w-[90vw] max-w-2xl">
		<Dialog.Title>Delete exercise</Dialog.Title>
		<Dialog.Description>Are you sure you want to delete this exercise?</Dialog.Description>
		<Dialog.Footer class="flex flex-row justify-end gap-2">
			<Dialog.Close class={buttonVariants({ variant: 'secondary' })}>Cancel</Dialog.Close>
			<Button variant="destructive" onclick={onDelete}>Confirm</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
