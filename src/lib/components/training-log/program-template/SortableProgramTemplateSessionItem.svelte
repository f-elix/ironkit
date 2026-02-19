<script lang="ts">
	import { useSortable } from '@dnd-kit-svelte/svelte/sortable';
	import type { Id } from '$convex/_generated/dataModel';
	import Button from '$lib/shadcn/button/button.svelte';

	let {
		session,
		index,
		isSelected,
		onSelect,
		onRemove
	}: {
		session: {
			_id: Id<'programWorkouts'>;
			weekNumber: number;
			trackKey: string;
			label?: string;
		};
		index: number;
		isSelected: boolean;
		onSelect: (id: Id<'programWorkouts'>) => void;
		onRemove: (id: Id<'programWorkouts'>) => void;
	} = $props();

	const { ref, isDragging } = useSortable({
		id: session._id,
		index: () => index
	});

	const sessionTitle = $derived(session.label?.trim() || session.trackKey);
</script>

<li
	class={[
		'rounded border p-2.5',
		isSelected ? 'border-primary bg-primary/5' : 'border-border',
		isDragging.current && 'ring-accent-foreground ring-1'
	]}
	{@attach ref}
>
	<div class="flex flex-wrap items-start justify-between gap-2">
		<button
			type="button"
			class="min-w-0 grow cursor-pointer text-left"
			onclick={() => onSelect(session._id)}
		>
			<p class="min-w-0 font-medium break-words">
				Week {session.weekNumber} · {sessionTitle}
			</p>
		</button>
		<Button
			variant="destructive"
			size="sm"
			onclick={(event) => {
				event.stopPropagation();
				onRemove(session._id);
			}}
			>Delete</Button
		>
	</div>
</li>
