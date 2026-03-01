<script lang="ts">
	import { formatDate } from '$lib/ui/formatDate';
	import { ScrollArea } from '$lib/shadcn/scroll-area';
	import type { Workout } from '$lib/jazz/types';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { now } from '@internationalized/date';
	import { TIMEZONE } from '$lib/constants';
	import PerformanceSetSummary from '$lib/components/training-log/PerformanceSetSummary.svelte';
	import { Exercise } from '$lib/jazz/schema';
	import { CoState } from 'jazz-tools/svelte';
	import { Loader } from '@lucide/svelte';

	let { exerciseId, currentWorkout }: { exerciseId: string; currentWorkout?: Maybe<Workout> } =
		$props();

	const exerciseState = new CoState(Exercise, () => exerciseId, {
		resolve: {
			performances: {
				$each: {
					performanceSets: { $each: true }
				}
			}
		}
	});

	const exercise = $derived(exerciseState.current.$isLoaded ? exerciseState.current : null);

	const performanceItems = $derived.by(() => {
		if (!exercise || !exercise.performances) {
			return [];
		}

		return exercise.performances
			.toSorted((a, b) => (b.workoutDate?.getTime() ?? 0) - (a.workoutDate?.getTime() ?? 0))
			.slice(0, 50);
	});
</script>

{#if performanceItems.length}
	<ScrollArea class="h-[50vh]">
		<ul class="divide-border flex flex-col gap-4 divide-y pt-4 pb-7">
			{#each performanceItems as performance (performance.$jazz.id)}
				{@const sets = performance.performanceSets.$isLoaded
					? Array.from(performance.performanceSets).filter((s) => s.$isLoaded)
					: []}
				{#if sets.length}
					<li class="flex flex-col gap-3 pb-4">
						<div class="flex flex-col gap-1">
							<h4 class="text-base font-semibold">{formatDate(performance.workoutDate)}</h4>
							{#if performance.note}
								<p class="text-muted-foreground text-sm">{performance.note}</p>
							{/if}
						</div>
						<ul class="flex flex-col gap-2">
							{#each sets as set, i (set.$jazz.id)}
								<li class="flex w-full items-baseline gap-2">
									<PerformanceSetSummary {set} {performance} order={i + 1} />
								</li>
							{/each}
						</ul>
					</li>
				{/if}
			{/each}
		</ul>
	</ScrollArea>
{:else if exercise?.$isLoaded}
	<div class="my-7">
		<EmptyState title="No history yet">
			{#snippet description()}
				Log this exercise in a workout to start tracking your progress.
			{/snippet}
		</EmptyState>
	</div>
{:else}
	<div
		class="text-muted-foreground flex h-40 animate-pulse items-center justify-center text-center"
	>
		Loading history...
	</div>
{/if}
