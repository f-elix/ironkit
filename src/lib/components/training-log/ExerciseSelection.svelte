<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import * as Command from '$lib/shadcn/command';
	import { cn } from '$lib/shadcn/utils';
	import { triplit } from '$lib/db/triplit';
	import { useQuery } from '@triplit/svelte';
	import ExerciseCreationDialog from '$lib/components/training-log/ExerciseCreationDialog.svelte';

	const query = useQuery(triplit, triplit.query('exercises'));

	let exercises = $derived(query.results ?? []);
	let value = $state('');
</script>

<Command.Root>
	<Command.Input placeholder="Search exercises" bind:value />
	<Command.List>
		<Command.Empty class="w-full">
			<ExerciseCreationDialog title={value} />
		</Command.Empty>
		{#if exercises.length}
			<Command.Group>
				{#each exercises as exercise (exercise.id)}
					<Command.Item
						value={exercise.id}
						onSelect={() => {
							value = exercise.id;
						}}
					>
						<Check class={cn(value !== exercise.id && 'text-transparent')} />
						{exercise.name}
					</Command.Item>
				{/each}
			</Command.Group>
		{/if}
	</Command.List>
</Command.Root>
