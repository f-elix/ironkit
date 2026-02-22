<script lang="ts">
	import { resolve } from '$app/paths';
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import type { Workout } from '$lib/db/types';
	import { formatDate } from '$lib/ui/formatDate';
	import Scale from '@lucide/svelte/icons/scale';
	import Dumbbell from '@lucide/svelte/icons/dumbbell';
	import Hash from '@lucide/svelte/icons/hash';
	import Pencil from '@lucide/svelte/icons/pencil';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import WorkoutInfoDialog from '$lib/components/training-log/WorkoutInfoDialog.svelte';
	import { buttonVariants } from '$lib/shadcn/button';

	let { workoutId, workout }: { workoutId: Id<'workouts'>; workout: Workout } = $props();

	let date = $derived(workout.date ? new Date(workout.date) : undefined);
	const statsQuery = useQuery(api.performanceGroups.getWorkoutStats, { workoutId });
	let exerciseCount = $derived(statsQuery.data?.exerciseCount ?? 0);
	let setCount = $derived(statsQuery.data?.setCount ?? 0);

	type StatPillProps = {
		Icon: typeof Scale;
		label: string;
		value: number | string;
		unit?: string;
	};
</script>

<div class="w-full text-left">
	<div class="bg-card px-4 py-4">
		<!-- Date & Title -->
		<div class="mb-4">
			<div class="flex items-start justify-between gap-3">
				<div class="flex min-w-0 items-center gap-1.5">
					<a
						href={resolve('/(app)/tools/training-log')}
						class={[
							buttonVariants({ variant: 'ghost', size: 'icon' }),
							'size-8 shrink-0 md:hidden'
						]}
						aria-label="Back to workouts list"
					>
						<ArrowLeft class="size-4" />
					</a>
					<h1 class="truncate text-2xl font-bold tracking-tight">
						{workout.title}
					</h1>
				</div>
				<div class="flex items-center gap-2">
					{#if date}
						<time class="text-muted-foreground text-sm font-medium">
							{formatDate(date)}
						</time>
					{/if}
					<WorkoutInfoDialog {workout}>
						{#snippet trigger({ props })}
							<button {...props} class={buttonVariants({ variant: 'ghost', size: 'icon' })}>
								<Pencil class="text-muted-foreground size-4" />
							</button>
						{/snippet}
					</WorkoutInfoDialog>
				</div>
			</div>
			{#if workout.notes}
				<p class="text-muted-foreground mt-1 text-sm">{workout.notes}</p>
			{/if}
		</div>

		{#snippet statPill({ Icon, label, value, unit = '' }: StatPillProps)}
			<div
				class="from-card to-muted/40 border-border/70 bg-muted flex-1 space-y-1 rounded-xl px-3 py-2"
			>
				<dt class="text-muted-foreground flex items-center gap-1 text-xs">
					<Icon class="size-3.5" />
					{label}
				</dt>
				<dd class="font-mono text-sm leading-none tabular-nums">
					{value}
					{#if unit}
						<span class="text-muted-foreground text-xs">{unit}</span>
					{/if}
				</dd>
			</div>
		{/snippet}

		<dl class="flex gap-2">
			{@render statPill({ Icon: Dumbbell, label: 'Exercises', value: exerciseCount })}
			{@render statPill({ Icon: Hash, label: 'Sets', value: setCount })}
			{@render statPill({
				Icon: Scale,
				label: 'Bodyweight',
				value: workout.bodyweight ?? '—',
				unit: workout.bodyweight ? (workout.bodyweightUnit ?? 'lbs') : undefined
			})}
		</dl>
	</div>
</div>
