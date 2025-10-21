<script lang="ts">
	import * as Dialog from '$lib/shadcn/dialog';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import { Button, buttonVariants } from '$lib/shadcn/button';
	import type { Doc } from '$convex/_generated/dataModel';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';

	let { exercise }: { exercise: Doc<'exercises'> } = $props();

	const client = useConvexClient();

	let open = $state(false);

	const onDelete = () => {
		client.mutation(
			api.exercises.remove,
			{ id: exercise._id },
			{
				optimisticUpdate: (localStore) => {
					localStore.setQuery(
						api.exercises.list,
						{},
						localStore.getQuery(api.exercises.list, {})?.filter((e) => e._id !== exercise._id) ?? []
					);
				}
			}
		);
		open = false;
	};
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger
		class={buttonVariants({ variant: 'destructive', size: 'icon', class: 'size-7' })}
		aria-label="Delete exercise"
	>
		<TrashIcon />
	</Dialog.Trigger>
	<Dialog.Content>
		<Dialog.Title>Delete exercise</Dialog.Title>
		<Dialog.Description>Are you sure you want to delete this exercise?</Dialog.Description>
		<Dialog.Footer class="flex flex-row justify-end gap-2">
			<Dialog.Close class={buttonVariants({ variant: 'secondary' })}>Cancel</Dialog.Close>
			<Button variant="destructive" onclick={onDelete}>Confirm</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
