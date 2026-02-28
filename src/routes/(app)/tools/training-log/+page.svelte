<script lang="ts">
	import AddWorkout from '$lib/components/training-log/AddWorkout.svelte';
	import WorkoutButton from '$lib/components/training-log/WorkoutButton.svelte';
	import ActiveProgramCard from '$lib/components/training-log/ActiveProgramCard.svelte';
	import PausedProgramCard from '$lib/components/training-log/PausedProgramCard.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import DumbbellIcon from '@lucide/svelte/icons/dumbbell';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import SwipeToDelete from '$lib/components/ui/SwipeToDelete.svelte';
	import { cn } from '$lib/shadcn/utils';
	import { flip } from 'svelte/animate';
	import { expoOut } from 'svelte/easing';
	import { scale } from 'svelte/transition';
	import { IronkitAccount, Workout } from '$lib/jazz/schema';
	import { AccountCoState } from 'jazz-tools/svelte';
	import { deleteCoValues } from 'jazz-tools';

	const account = new AccountCoState(IronkitAccount, {
		resolve: {
			root: {
				workouts: {
					$each: {
						programRun: true,
						programRunSession: true
					}
				},
				programRuns: {
					$each: {
						programTemplate: {
							programWorkouts: {
								$each: {
									performanceGroups: {
										$each: {
											performances: {
												$each: {
													exercise: true,
													performanceSets: {
														$each: true
													}
												}
											}
										}
									}
								}
							}
						},
						programRunSessions: {
							$each: true
						}
					}
				}
			}
		}
	});

	const root = $derived(account.current.$isLoaded ? account.current.root : null);

	const workouts = $derived.by(() => {
		if (!root) {
			return [];
		}

		return root.workouts.toSorted((a, b) => b.date.getTime() - a.date.getTime());
	});

	const activeRun = $derived.by(() => {
		if (!root) {
			return null;
		}

		return (
			root.programRuns
				.filter((run) => run.status === 'active' || run.status === 'paused')
				.toSorted((a, b) => b.startedAt.getTime() - a.startedAt.getTime())[0] ?? null
		);
	});

	const deleteWorkout = (workoutId: string) => {
		if (!root) {
			return;
		}
		deleteCoValues(Workout, workoutId, {
			resolve: {
				performanceGroups: {
					$each: {
						performances: {
							$each: {
								performanceSets: {
									$each: true
								}
							}
						}
					}
				}
			}
		});
	};
</script>

{#snippet activeProgramCard()}
	{#if activeRun}
		{#if activeRun.status === 'paused'}
			<PausedProgramCard run={activeRun} />
		{:else}
			<ActiveProgramCard run={activeRun} />
		{/if}
	{/if}
{/snippet}

{#snippet desktopWorkoutList()}
	<ul class="flex flex-col gap-3">
		{#each workouts as workout (workout.$jazz.id)}
			<li
				class="hover:border-primary/50 overflow-hidden rounded-lg border transition-all active:scale-[0.98]"
			>
				<WorkoutButton {workout} />
			</li>
		{/each}
	</ul>
{/snippet}

<div class="hidden grow lg:flex">
	{#if activeRun && workouts.length}
		<div
			class="sticky top-20 flex h-[calc(100dvh-6.5rem)] basis-2/3 flex-col items-center justify-center self-start px-8"
		>
			<div class="w-full max-w-md">
				{@render activeProgramCard()}
			</div>
		</div>
		<div class="basis-1/3 overflow-y-auto pl-4">
			{@render desktopWorkoutList()}
		</div>
	{:else if activeRun}
		<div class="flex grow items-center justify-center px-8">
			<div class="w-full max-w-md">
				{@render activeProgramCard()}
			</div>
		</div>
	{:else if workouts.length}
		<div class="sticky top-20 flex h-[calc(100dvh-6.5rem)] basis-2/3 flex-col self-start">
			<EmptyState title="Select a workout">
				{#snippet icon()}
					<DumbbellIcon class="text-muted-foreground size-12" />
				{/snippet}
				{#snippet description()}
					Choose a workout from the list
					<br />
					or create a new one.
				{/snippet}
				{#snippet button()}
					<AddWorkout />
				{/snippet}
			</EmptyState>
		</div>
		<div class="basis-1/3 overflow-y-auto pl-4">
			{@render desktopWorkoutList()}
		</div>
	{:else if root}
		<EmptyState title="No workouts yet">
			{#snippet icon()}
				<DumbbellIcon class="text-muted-foreground size-12" />
			{/snippet}
			{#snippet description()}
				Click the button below
				<br />
				to create your first workout.
			{/snippet}
			{#snippet button()}
				<AddWorkout />
			{/snippet}
		</EmptyState>
	{/if}
</div>

<div class="flex grow flex-col p-4 lg:hidden">
	{#if activeRun}
		<div class="mb-4">
			{@render activeProgramCard()}
		</div>
	{/if}
	{#if workouts.length}
		<div class="flex grow flex-col gap-4">
			<ul class="flex flex-col gap-4 pb-20">
				{#each workouts as workout (workout.$jazz.id)}
					<li
						animate:flip={{ duration: 500, easing: expoOut }}
						in:scale={{ duration: 500, easing: expoOut, start: 0.5, opacity: 0.5 }}
						out:scale={{ duration: 300, easing: expoOut, start: 0.5, opacity: 0 }}
						class="overflow-hidden rounded-lg border transition-transform active:scale-[0.98]"
					>
						<SwipeToDelete ondelete={() => deleteWorkout(workout.$jazz.id)}>
							<WorkoutButton {workout} />
						</SwipeToDelete>
					</li>
				{/each}
			</ul>
			<div class="fixed right-4 bottom-16 z-50">
				<AddWorkout
					size="icon"
					class={cn(
						'rounded-full shadow-lg',
						activeRun
							? 'bg-muted text-muted-foreground hover:bg-muted/80 size-11'
							: 'bg-primary text-primary-foreground hover:bg-primary/90 size-14'
					)}
				>
					<PlusIcon class={activeRun ? 'size-5' : 'size-7'} />
				</AddWorkout>
			</div>
		</div>
	{:else if root && !activeRun}
		<div class="grow pb-4">
			<EmptyState title="No workouts yet">
				{#snippet description()}
					Click the button below
					<br />
					to create your first workout.
				{/snippet}
				{#snippet button()}
					<AddWorkout />
				{/snippet}
			</EmptyState>
		</div>
	{/if}
</div>
