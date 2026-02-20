<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import { Button } from '$lib/shadcn/button';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import CheckIcon from '@lucide/svelte/icons/check';
	import CircleIcon from '@lucide/svelte/icons/circle';
	import CircleSlashIcon from '@lucide/svelte/icons/circle-slash';
	import PauseIcon from '@lucide/svelte/icons/pause';
	import PlayIcon from '@lucide/svelte/icons/play';
	import XIcon from '@lucide/svelte/icons/x';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { toast } from 'svelte-sonner';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import CancelProgramDialog from '$lib/components/training-log/programs/CancelProgramDialog.svelte';

	const runId = $derived(page.params.id as Id<'programRuns'>);
	const runQuery = useQuery(api.programRuns.getById, () => ({ id: runId }));
	const templateQuery = useQuery(
		api.programTemplates.getById,
		() => {
			const run = runQuery.data;
			return run ? { id: run.programTemplateId } : 'skip';
		}
	);

	const client = useConvexClient();

	let isPausing = $state(false);
	let isResuming = $state(false);
	let isCanceling = $state(false);
	let cancelDialogOpen = $state(false);

	const run = $derived(runQuery.data);
	const template = $derived(templateQuery.data);

	interface SessionWithDetails {
		_id: Id<'programRunSessions'>;
		programWorkoutId: Id<'programWorkouts'>;
		workoutId?: Id<'workouts'>;
		skippedAt?: number;
		programWorkout?: {
			weekNumber: number;
			slotOrder: number;
			trackKey: string;
			label?: string;
		};
		workout?: {
			_id: Id<'workouts'>;
			title?: string;
			date?: number;
		} | null;
	}

	const sessions = $derived((run?.sessions ?? []) as SessionWithDetails[]);
	const completedCount = $derived(
		sessions.filter((s) => s.workoutId !== undefined || s.skippedAt !== undefined).length
	);
	const totalCount = $derived(sessions.length);
	const progressPercent = $derived(totalCount > 0 ? (completedCount / totalCount) * 100 : 0);

	const firstOpenIndex = $derived(
		sessions.findIndex((s) => s.workoutId === undefined && s.skippedAt === undefined)
	);

	const sessionsByWeek = $derived.by(() => {
		const map = new Map<number, SessionWithDetails[]>();
		for (const session of sessions) {
			const week = session.programWorkout?.weekNumber ?? 1;
			if (!map.has(week)) {
				map.set(week, []);
			}
			map.get(week)!.push(session);
		}
		return map;
	});

	const sortedWeeks = $derived([...sessionsByWeek.keys()].sort((a, b) => a - b));

	const dateFormatter = new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium' });
	const formatDate = (timestamp: number) => dateFormatter.format(new Date(timestamp));

	type SessionState = 'completed' | 'skipped' | 'next' | 'pending';
	const getSessionState = (session: SessionWithDetails, index: number): SessionState => {
		if (session.workoutId !== undefined) return 'completed';
		if (session.skippedAt !== undefined) return 'skipped';
		if (index === firstOpenIndex) return 'next';
		return 'pending';
	};

	const handlePause = async () => {
		if (isPausing || !run) return;
		isPausing = true;
		try {
			await client.mutation(api.programRuns.pauseRun, { id: run._id });
			toast.success('Program paused');
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Could not pause program.');
		} finally {
			isPausing = false;
		}
	};

	const handleResume = async () => {
		if (isResuming || !run) return;
		isResuming = true;
		try {
			await client.mutation(api.programRuns.resumeRun, { id: run._id });
			toast.success('Program resumed');
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Could not resume program.');
		} finally {
			isResuming = false;
		}
	};

	const handleCancelConfirm = async () => {
		if (isCanceling || !run) return;
		isCanceling = true;
		try {
			await client.mutation(api.programRuns.cancelRun, { id: run._id });
			cancelDialogOpen = false;
			toast.success('Program canceled');
			goto(resolve('/(app)/tools/training-log/programs'));
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Could not cancel program.');
		} finally {
			isCanceling = false;
		}
	};

	const isActive = $derived(run?.status === 'active');
	const isPaused = $derived(run?.status === 'paused');
	const canPauseResume = $derived(isActive || isPaused);
	const canCancel = $derived(isActive || isPaused);
</script>

{#if run && template}
	<div class="flex min-h-full flex-col p-4 md:p-0">
		<div class="mx-auto w-full max-w-2xl space-y-6 py-2">
			<header class="flex items-start gap-4">
				<Button
					variant="outline"
					size="icon"
					href={resolve('/(app)/tools/training-log/programs')}
					aria-label="Back to programs"
				>
					<ArrowLeftIcon />
				</Button>
				<div class="min-w-0 flex-1">
					<h1 class="truncate text-xl font-bold">{template.name}</h1>
					<p class="text-muted-foreground mt-0.5 text-sm">
						Started {formatDate(run.startedAt)}
					</p>
				</div>
			</header>

			<section class="space-y-2">
				<div class="flex items-center justify-between text-sm">
					<span class="text-muted-foreground">Progress</span>
					<span class="font-medium tabular-nums">{completedCount} of {totalCount}</span>
				</div>
				<div class="bg-muted h-2 overflow-hidden rounded-full">
					<div
						class="bg-primary h-full transition-all duration-300"
						style:width="{progressPercent}%"
					></div>
				</div>
			</section>

			<section class="space-y-4">
				{#each sortedWeeks as weekNumber (weekNumber)}
					{@const weekSessions = sessionsByWeek.get(weekNumber) ?? []}
					<div class="space-y-2">
						<h2 class="text-muted-foreground text-sm font-medium">Week {weekNumber}</h2>
						<ul class="bg-card divide-border divide-y rounded-xl border">
							{#each weekSessions as session (session._id)}
								{@const globalIndex = sessions.indexOf(session)}
								{@const state = getSessionState(session, globalIndex)}
								{@const label = session.programWorkout?.label ?? session.programWorkout?.trackKey ?? 'Session'}
								<li>
									{#if state === 'completed' && session.workoutId}
										<a
											href={resolve('/(app)/tools/training-log/workout-[id]', { id: session.workoutId })}
											class="hover:bg-muted/50 flex items-center gap-3 px-4 py-3 transition-colors"
										>
											<span class="bg-primary/10 text-primary flex size-6 shrink-0 items-center justify-center rounded-full">
												<CheckIcon class="size-3.5" />
											</span>
											<span class="min-w-0 flex-1 truncate font-medium">{label}</span>
											{#if session.workout?.date}
												<span class="text-muted-foreground shrink-0 text-xs tabular-nums">
													{formatDate(session.workout.date)}
												</span>
											{/if}
										</a>
									{:else if state === 'next'}
										<div class="flex items-center gap-3 px-4 py-3">
											<span class="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full">
												<PlayIcon class="size-3" />
											</span>
											<span class="min-w-0 flex-1 truncate font-medium">{label}</span>
											<span class="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
												Up next
											</span>
										</div>
									{:else if state === 'skipped'}
										<div class="flex items-center gap-3 px-4 py-3 opacity-50">
											<span class="bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-full">
												<CircleSlashIcon class="size-3.5" />
											</span>
											<span class="min-w-0 flex-1 truncate">{label}</span>
											<span class="text-muted-foreground text-xs">Skipped</span>
										</div>
									{:else}
										<div class="flex items-center gap-3 px-4 py-3 opacity-40">
											<span class="text-muted-foreground flex size-6 shrink-0 items-center justify-center">
												<CircleIcon class="size-4" />
											</span>
											<span class="min-w-0 flex-1 truncate">{label}</span>
										</div>
									{/if}
								</li>
							{/each}
						</ul>
					</div>
				{/each}
			</section>

			{#if canPauseResume || canCancel}
				<footer class="sticky bottom-4 flex gap-3 pt-4 md:static md:bottom-auto">
					{#if canPauseResume}
						{#if isActive}
							<Button
								variant="outline"
								class="flex-1"
								onclick={handlePause}
								disabled={isPausing}
							>
								<PauseIcon />
								{isPausing ? 'Pausing...' : 'Pause'}
							</Button>
						{:else if isPaused}
							<Button
								variant="outline"
								class="flex-1"
								onclick={handleResume}
								disabled={isResuming}
							>
								<PlayIcon />
								{isResuming ? 'Resuming...' : 'Resume'}
							</Button>
						{/if}
					{/if}
					{#if canCancel}
						<Button
							variant="destructive"
							class="flex-1"
							onclick={() => (cancelDialogOpen = true)}
						>
							<XIcon />
							Cancel Program
						</Button>
					{/if}
				</footer>
			{/if}
		</div>
	</div>
{:else if runQuery.isLoading || templateQuery.isLoading}
	<div class="flex min-h-full flex-col p-4 md:p-0">
		<div class="mx-auto w-full max-w-2xl space-y-6 py-2">
			<header class="flex items-start gap-4">
				<div class="bg-muted size-10 animate-pulse rounded-lg"></div>
				<div class="flex-1 space-y-2">
					<div class="bg-muted h-6 w-48 animate-pulse rounded"></div>
					<div class="bg-muted h-4 w-32 animate-pulse rounded"></div>
				</div>
			</header>
			<div class="space-y-2">
				<div class="bg-muted h-4 w-24 animate-pulse rounded"></div>
				<div class="bg-muted h-2 animate-pulse rounded-full"></div>
			</div>
			<div class="space-y-4">
				{#each [1, 2] as week (week)}
					<div class="space-y-2">
						<div class="bg-muted h-4 w-16 animate-pulse rounded"></div>
						<div class="bg-card animate-pulse rounded-xl border p-4">
							<div class="space-y-3">
								{#each [1, 2, 3] as item (item)}
									<div class="bg-muted h-6 animate-pulse rounded"></div>
								{/each}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
{:else}
	<EmptyState title="Program not found">
		{#snippet icon()}
			<AlertCircleIcon class="text-muted-foreground size-12" />
		{/snippet}
		{#snippet description()}
			This program run doesn't exist
			<br />
			or you don't have access to it.
		{/snippet}
		{#snippet button()}
			<Button href={resolve('/(app)/tools/training-log/programs')}>
				Back to Programs
			</Button>
		{/snippet}
	</EmptyState>
{/if}

<CancelProgramDialog bind:open={cancelDialogOpen} onConfirm={handleCancelConfirm} isLoading={isCanceling} />
