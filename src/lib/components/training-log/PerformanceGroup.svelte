<script lang="ts">
	import Performance from '$lib/components/training-log/Performance.svelte';
	import { triplit } from '$lib/db/triplit';
	import type { WorkoutWithRelations } from '$lib/db/types';
	import Button from '$lib/shadcn/button/button.svelte';
	import * as Card from '$lib/shadcn/card';
	import Trash from '@lucide/svelte/icons/trash';

	type Group = WorkoutWithRelations['performanceGroups'][number];

	let { performanceGroup }: { performanceGroup: Group } = $props();

	let label = $derived(performanceGroup.label);
	let performances = $derived(performanceGroup.performances);

	const onDelete = () => {
		triplit.delete('performanceGroups', performanceGroup.id);
	};
</script>

<Card.Root>
	<Card.Header class="flex w-full items-center justify-between">
		{#if label}
			<Card.Title>{label}</Card.Title>
		{/if}
		<Button
			variant="destructive"
			size="icon"
			class="ml-auto"
			aria-label={performances.length > 1 ? 'Delete exercise group' : 'Delete exercise'}
			onclick={onDelete}
		>
			<Trash />
		</Button>
	</Card.Header>
	<Card.Content>
		<ul class="flex flex-col gap-2">
			{#each performances as performance (performance.id)}
				<li class="flex flex-col gap-2">
					<Performance {performance} />
				</li>
			{/each}
		</ul>
	</Card.Content>
	<Card.Footer>
		<!-- TODO: Add footer -->
	</Card.Footer>
</Card.Root>
