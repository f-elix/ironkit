<script lang="ts">
	import { useSortable } from '@dnd-kit-svelte/svelte/sortable';
	import type { Id } from '$convex/_generated/dataModel';
	import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';

	let {
		workoutId,
		trackKey,
		label,
		index,
		isSelected,
		trackColorClass,
		onSelect
	}: {
		workoutId: Id<'programWorkouts'>;
		trackKey: string;
		label: string | undefined;
		index: number;
		isSelected: boolean;
		trackColorClass: string;
		onSelect: (id: Id<'programWorkouts'>) => void;
	} = $props();

	const { ref, isDragging } = useSortable({
		id: workoutId,
		index: () => index
	});
</script>

<li
	class={[
		'flex min-w-28 max-w-48 rounded-lg border transition-all duration-150 sm:min-w-36 sm:max-w-56',
		isDragging.current
			? 'border-primary/50 bg-primary/10 shadow-primary/10 ring-primary/20 z-10 shadow-lg ring-1'
			: isSelected
				? 'border-primary/50 bg-primary/5 shadow-primary/5 shadow-sm'
				: 'border-border/40 bg-card/25 hover:border-border/70 hover:bg-card/50'
	]}
	{@attach ref}
>
	<div
		class="text-muted-foreground/30 flex shrink-0 cursor-grab items-center px-2 active:cursor-grabbing"
	>
		<GripVerticalIcon class="size-3.5" />
	</div>
	<button
		type="button"
		class="flex min-w-0 flex-1 flex-col gap-1.5 p-2 pl-0.5 text-left sm:gap-2 sm:p-3 sm:pl-1"
		onclick={() => onSelect(workoutId)}
	>
		<span
			class={[
				'inline-flex w-fit rounded border px-1.5 py-px text-[10px] font-bold tracking-wider uppercase sm:px-2 sm:py-0.5 sm:text-[11px]',
				trackColorClass
			]}
		>
			{trackKey}
		</span>
		<span class="truncate text-sm leading-snug font-medium sm:text-[15px]">
			{label || 'Untitled'}
		</span>
	</button>
</li>
