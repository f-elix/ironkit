<script lang="ts">
	import type { Exercise } from '$lib/db/types';
	import * as Dialog from '$lib/shadcn/dialog';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import { Button, buttonVariants } from '$lib/shadcn/button';
	import { triplit } from '$lib/db/triplit';

	let { exercise }: { exercise: Exercise } = $props();

	const onDelete = async () => {
		const performances = await triplit.fetch(
			triplit.query('performances').Where('exerciseId', '=', exercise.id).Include('sets')
		);
		const performanceGroupIds = performances.map((performance) => performance.performanceGroupId);
		await triplit.transact(async (tx) => {
			for (const performance of performances) {
				for (const set of performance.sets) {
					await tx.delete('performanceSets', set.id);
				}
				await tx.delete('performances', performance.id);
			}

			await tx.delete('exercises', exercise.id);
		});
		const performanceGroups = await triplit.fetch(
			triplit
				.query('performanceGroups')
				.Where('id', 'in', performanceGroupIds)
				.Include('performances')
		);
		await triplit.transact(async (tx) => {
			for (const performanceGroup of performanceGroups) {
				if (performanceGroup.performances.length === 0) {
					await tx.delete('performanceGroups', performanceGroup.id);
				}
			}
		});
	};
</script>

<Dialog.Root>
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
