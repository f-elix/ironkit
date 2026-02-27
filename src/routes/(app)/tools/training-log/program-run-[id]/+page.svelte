<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Button } from '$lib/shadcn/button';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import CheckIcon from '@lucide/svelte/icons/check';
	import CircleIcon from '@lucide/svelte/icons/circle';
	import CircleSlashIcon from '@lucide/svelte/icons/circle-slash';
	import PauseIcon from '@lucide/svelte/icons/pause';
	import PlayIcon from '@lucide/svelte/icons/play';
	import XIcon from '@lucide/svelte/icons/x';
	import { CoState } from 'jazz-tools/svelte';
	import { ProgramRun } from '$lib/jazz/schema';
	import { toast } from 'svelte-sonner';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import CancelProgramDialog from '$lib/components/training-log/programs/CancelProgramDialog.svelte';
	import { SvelteMap } from 'svelte/reactivity';

	type SessionWithDetails = (typeof sessions)[number];
	type SessionState = 'completed' | 'skipped' | 'next' | 'pending';

	const runId = $derived(page.params.id);

	const runState = new CoState(ProgramRun, () => runId, {
		resolve: {
			programTemplate: {
				programWorkouts: {
					$each: true
				}
			},
			programRunSessions: {
				$each: true
			}
		}
	});

	const run = $derived(runState.current.$isLoaded ? runState.current : undefined);

	let cancelDialogOpen = $state(false);

	const template = $derived(run?.$isLoaded ? run.programTemplate : undefined);

	const sessions = $derived.by(() => {
		if (!run?.$isLoaded) {
			return [];
		}

		return run.programRunSessions.map((session) => {
			const programWorkout = run.programTemplate.programWorkouts.find(
				(pw) => pw.$jazz.id === session.programWorkoutId
			);

			return {
				...session,
				programWorkout
			};
		});
	});
	const completedCount = $derived(
		sessions.filter((s) => s.workoutId !== undefined || s.skippedAt !== undefined).length
	);
	const totalCount = $derived(sessions.length);
	const progressPercent = $derived(totalCount > 0 ? (completedCount / totalCount) * 100 : 0);

	const firstOpenIndex = $derived(
		sessions.findIndex((s) => s.workoutId === undefined && s.skippedAt === undefined)
	);

	const sessionsByWeek = $derived.by(() => {
		const map = new SvelteMap<number, SessionWithDetails[]>();
		for (const session of sessions) {
			const week = session.programWorkout?.weekNumber ?? 1;
			if (!map.has(week)) {
				map.set(week, []);
			}
			map.get(week)!.push(session);
		}
		return map;
	});

	const sortedWeeks = $derived([...sessionsByWeek.keys()].toSorted((a, b) => a - b));

	const dateFormatter = new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium' });
	const formatDate = (date: Date) => dateFormatter.format(date);

	const getSessionState = (session: SessionWithDetails, index: number): SessionState => {
		if (session.workoutId !== undefined) {
			return 'completed';
		}
		if (session.skippedAt !== undefined) {
			return 'skipped';
		}
		if (index === firstOpenIndex) {
			return 'next';
		}
		return 'pending';
	};

	const handlePause = async () => {
		if (!run) {
			return;
		}
		run.$jazz.set('status', 'paused');
		toast.success('Program paused');
	};

	const handleResume = async () => {
		if (!run) {
			return;
		}
		run.$jazz.set('status', 'active');
		toast.success('Program resumed');
	};

	const handleCancelConfirm = async () => {
		if (!run) {
			return;
		}
		run.$jazz.set('status', 'canceled');
		run.$jazz.set('endedAt', new Date());
		cancelDialogOpen = false;
		toast.success('Program canceled');
		goto(resolve('/(app)/tools/training-log/programs'));
	};

	const isActive = $derived(run?.$isLoaded ? run.status === 'active' : false);
	const isPaused = $derived(run?.$isLoaded ? run.status === 'paused' : false);
	const canPauseResume = $derived(isActive || isPaused);
	const canCancel = $derived(isActive || isPaused);
</script>

{#if run?.$isLoaded && template}
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
							{#each weekSessions as session (session.$jazz.id)}
								{@const globalIndex = sessions.indexOf(session)}
								{@const state = getSessionState(session, globalIndex)}
								{@const label =
									session.programWorkout?.label ?? session.programWorkout?.trackKey ?? 'Session'}
								<li>
									{#if state === 'completed' && session.workoutId}
										<a
											href={resolve('/(app)/tools/training-log/workout-[id]', {
												id: session.workoutId
											})}
											class="hover:bg-muted/50 flex items-center gap-3 px-4 py-3 transition-colors"
										>
											<span
												class="bg-primary/10 text-primary flex size-6 shrink-0 items-center justify-center rounded-full"
											>
												<CheckIcon class="size-3.5" />
											</span>
											<span class="min-w-0 flex-1 truncate font-medium">{label}</span>
										</a>
									{:else if state === 'next'}
										<div class="flex items-center gap-3 px-4 py-3">
											<span
												class="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full"
											>
												<PlayIcon class="size-3" />
											</span>
											<span class="min-w-0 flex-1 truncate font-medium">{label}</span>
											<span
												class="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium"
											>
												Up next
											</span>
										</div>
									{:else if state === 'skipped'}
										<div class="flex items-center gap-3 px-4 py-3 opacity-50">
											<span
												class="bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-full"
											>
												<CircleSlashIcon class="size-3.5" />
											</span>
											<span class="min-w-0 flex-1 truncate">{label}</span>
											<span class="text-muted-foreground text-xs">Skipped</span>
										</div>
									{:else}
										<div class="flex items-center gap-3 px-4 py-3 opacity-40">
											<span
												class="text-muted-foreground flex size-6 shrink-0 items-center justify-center"
											>
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
							<Button variant="outline" class="flex-1" onclick={handlePause}>
								<PauseIcon />
								Pause
							</Button>
						{:else if isPaused}
							<Button variant="outline" class="flex-1" onclick={handleResume}>
								<PlayIcon />
								Resume
							</Button>
						{/if}
					{/if}
					{#if canCancel}
						<Button variant="destructive" class="flex-1" onclick={() => (cancelDialogOpen = true)}>
							<XIcon />
							Cancel Program
						</Button>
					{/if}
				</footer>
			{/if}
		</div>
	</div>
{:else if !run}
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
			<Button href={resolve('/(app)/tools/training-log/programs')}>Back to Programs</Button>
		{/snippet}
	</EmptyState>
{/if}

<CancelProgramDialog bind:open={cancelDialogOpen} onConfirm={handleCancelConfirm} />
