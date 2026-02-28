<script lang="ts">
	import { buttonVariants } from '$lib/shadcn/button';
	import * as AlertDialog from '$lib/shadcn/alert-dialog';

	let {
		open = $bindable(),
		onConfirm
	}: {
		open: boolean;
		onConfirm: () => void;
	} = $props();
</script>

<AlertDialog.Root bind:open>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Cancel program</AlertDialog.Title>
			<AlertDialog.Description>
				This will end your program run. Any completed workouts will remain in your training log, but
				you won't be able to resume this program.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel class={buttonVariants({ variant: 'outline' })}>
				Keep running
			</AlertDialog.Cancel>
			<AlertDialog.Action class={buttonVariants({ variant: 'destructive' })} onclick={onConfirm}>
				Cancel program
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
