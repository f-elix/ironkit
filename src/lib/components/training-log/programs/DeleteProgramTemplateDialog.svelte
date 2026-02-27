<script lang="ts">
	import type { ProgramTemplate } from '$lib/jazz/types';
	import { Button, buttonVariants } from '$lib/shadcn/button';
	import * as Dialog from '$lib/shadcn/dialog';

	let {
		open = $bindable(),
		template,
		onConfirmDelete
	}: {
		open: boolean;
		template: ProgramTemplate | null;
		onConfirmDelete: () => void;
	} = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Content>
		<Dialog.Title>Delete template</Dialog.Title>
		<Dialog.Description>
			{#if template}
				Delete
				<span class="font-medium">{template.name}</span>? This also removes associated template
				workouts.
			{/if}
		</Dialog.Description>
		<Dialog.Footer class="flex flex-row justify-end gap-2">
			<Dialog.Close class={buttonVariants({ variant: 'secondary' })}>Cancel</Dialog.Close>
			<Button variant="destructive" onclick={onConfirmDelete}>Delete template</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
