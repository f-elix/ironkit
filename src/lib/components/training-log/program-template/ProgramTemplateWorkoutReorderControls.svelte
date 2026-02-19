<script lang="ts">
	import Button from '$lib/shadcn/button/button.svelte';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

	let {
		position,
		total,
		onMove
	}: {
		position: number;
		total: number;
		onMove: (direction: -1 | 1) => Promise<void> | void;
	} = $props();
</script>

<div class="border-border/25 bg-muted/10 flex items-center justify-between rounded-lg border px-3 py-2">
	<span class="text-muted-foreground text-xs tabular-nums">
		Position {position + 1} of {total} in week
	</span>
	<div class="flex gap-1">
		<Button
			variant="ghost"
			size="icon"
			class="size-6"
			disabled={position === 0}
			onclick={() => onMove(-1)}
		>
			<ChevronLeftIcon class="size-3.5" />
		</Button>
		<Button
			variant="ghost"
			size="icon"
			class="size-6"
			disabled={position === total - 1}
			onclick={() => onMove(1)}
		>
			<ChevronRightIcon class="size-3.5" />
		</Button>
	</div>
</div>
