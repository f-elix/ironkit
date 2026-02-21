<script lang="ts">
	import type { Workout } from '$lib/db/types';
	import { formatDate } from '$lib/ui/formatDate';
	import Scale from '@lucide/svelte/icons/scale';
	import Pencil from '@lucide/svelte/icons/pencil';

	let { workout, ...props }: { workout: Workout } & Record<string, unknown> = $props();

	let date = $derived(workout.date ? new Date(workout.date) : undefined);
</script>

<button {...props} class="w-full text-left">
	<div class="border-border bg-card border-b px-4 py-4">
		<!-- Date & Title -->
		<div class="mb-4">
			<div class="flex items-baseline justify-between">
				<h1 class="text-2xl font-bold tracking-tight">
					{workout.title}
				</h1>
				<div class="flex items-center gap-2">
					{#if date}
						<time class="text-muted-foreground text-sm font-medium">
							{formatDate(date)}
						</time>
					{/if}
					<Pencil class="text-muted-foreground size-4" />
				</div>
			</div>
			{#if workout.notes}
				<p class="text-muted-foreground mt-1 text-sm">{workout.notes}</p>
			{/if}
		</div>

		<!-- Bodyweight if present -->
		{#if workout.bodyweight}
			<div class="bg-muted/50 flex items-center justify-center gap-2 rounded-lg py-2">
				<Scale class="text-muted-foreground size-4" />
				<span class="text-muted-foreground text-sm font-medium">Bodyweight:</span>
				<span class="font-mono font-bold">{workout.bodyweight}</span>
				<span class="text-muted-foreground font-mono text-sm"
					>{workout.bodyweightUnit ?? 'lbs'}</span
				>
			</div>
		{/if}
	</div>
</button>
