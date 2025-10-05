<script lang="ts">
	import type { Workout } from '$lib/db/types';
	import { Button, buttonVariants } from '$lib/shadcn/button';
	import * as Dialog from '$lib/shadcn/dialog';
	import { triplit } from '$lib/db/triplit';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	let { workout, open = $bindable() }: { workout: Workout; open: boolean } = $props();

	const onDelete = async () => {
		const workoutId = workout.id;
		const performanceGroups = await triplit.fetch(
			triplit
				.query('performanceGroups')
				.Where('workoutId', '=', workoutId)
				.Include('performances', (rel) => rel('performances').Include('sets'))
		);
		await triplit.transact(async (tx) => {
			await tx.delete('workouts', workoutId);
			for (const performanceGroup of performanceGroups) {
				for (const performance of performanceGroup.performances) {
					for (const set of performance.sets) {
						await tx.delete('performanceSets', set.id);
					}
					await tx.delete('performances', performance.id);
				}
				await tx.delete('performanceGroups', performanceGroup.id);
			}
		});
		goto(resolve('/(app)/tools/training-log'));
	};
</script>

<Dialog.Root bind:open>
	<Dialog.Content>
		<Dialog.Title>Delete workout</Dialog.Title>
		<Dialog.Description>
			Are you sure you want to delete this workout? This action cannot be undone.
		</Dialog.Description>
		<Dialog.Footer class="flex flex-row justify-end gap-2">
			<Dialog.Close class={buttonVariants({ variant: 'secondary' })}>Cancel</Dialog.Close>
			<Button variant="destructive" onclick={onDelete}>Confirm</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
