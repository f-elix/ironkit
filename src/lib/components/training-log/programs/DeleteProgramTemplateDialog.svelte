<script lang="ts">
	import type { Doc } from '$convex/_generated/dataModel';
	import { Button, buttonVariants } from '$lib/shadcn/button';
	import * as Dialog from '$lib/shadcn/dialog';

	let {
		open = $bindable(),
		template,
		isDeleting,
		deleteError,
		onConfirmDelete
	}: {
		open: boolean;
		template: Doc<'programTemplates'> | null;
		isDeleting: boolean;
		deleteError: string;
		onConfirmDelete: () => void;
	} = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Content>
		<Dialog.Title>Delete template</Dialog.Title>
		<Dialog.Description>
			{#if template}
				Delete
				<span class="font-medium">{template.name}</span>? This also removes associated template workouts.
			{/if}
		</Dialog.Description>
		{#if deleteError}
			<p class="text-destructive text-sm">{deleteError}</p>
		{/if}
		<Dialog.Footer class="flex flex-row justify-end gap-2">
			<Dialog.Close class={buttonVariants({ variant: 'secondary' })}>Cancel</Dialog.Close>
			<Button variant="destructive" disabled={isDeleting} onclick={onConfirmDelete}>
				{isDeleting ? 'Deleting...' : 'Delete template'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
