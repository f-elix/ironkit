<script lang="ts">
	import ExercisesCombobox from '$lib/components/training-log/ExercisesCombobox.svelte';
	import { buttonVariants } from '$lib/shadcn/button';
	import * as Dialog from '$lib/shadcn/dialog';

	let open = $state(false);

	const dialogTitle = 'Select an exercise';
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger class={buttonVariants({ variant: 'secondary', size: 'lg' })}>
		Add exercise
	</Dialog.Trigger>
	<Dialog.Content class="w-[90vw] max-w-2xl">
		<Dialog.Title class="text-left">{dialogTitle}</Dialog.Title>
		<div class="flex flex-col gap-4">
			<ExercisesCombobox />
		</div>
	</Dialog.Content>
</Dialog.Root>
