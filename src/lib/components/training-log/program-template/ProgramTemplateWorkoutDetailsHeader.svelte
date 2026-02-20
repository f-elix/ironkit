<script lang="ts">
	import XIcon from '@lucide/svelte/icons/x';

	let {
		trackKey,
		weekNumber,
		label,
		trackColorClass,
		onClose
	}: {
		trackKey: string;
		weekNumber: number;
		label: string;
		trackColorClass: string;
		onClose: () => void;
	} = $props();
</script>

<div
	class="border-border/40 bg-background/95 sticky top-0 z-10 border-b px-6 pt-6 pb-4 backdrop-blur-sm"
>
	<div class="flex items-center gap-2">
		<span
			class={[
				'rounded border px-1.5 py-px text-[10px] font-bold tracking-wider uppercase',
				trackColorClass
			]}
		>
			{trackKey}
		</span>
		<span class="text-muted-foreground text-xs tabular-nums">Week {weekNumber}</span>
		<button
			type="button"
			class="text-muted-foreground hover:text-foreground ml-auto rounded-sm transition-opacity"
			onclick={onClose}
		>
			<XIcon class="size-5" />
			<span class="sr-only">Close</span>
		</button>
	</div>
	<h2 class="mt-1 text-lg leading-snug font-semibold">
		{label || 'Untitled workout'}
	</h2>
</div>
