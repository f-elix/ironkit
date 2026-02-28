<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { ProgramRunSession } from '$lib/jazz/schema';
	import type { ResolvedProgramRun } from '$lib/jazz/types';
	import { createWorkoutFromProgramWorkout } from '$lib/jazz/workout';
	import { Button, buttonVariants } from '$lib/shadcn/button';
	import * as DropdownMenu from '$lib/shadcn/dropdown-menu';
	import { cn } from '$lib/shadcn/utils';
	import { NotebookPenIcon } from '@lucide/svelte';
	import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import FastForwardIcon from '@lucide/svelte/icons/fast-forward';
	import PauseIcon from '@lucide/svelte/icons/pause';
	import PlayIcon from '@lucide/svelte/icons/play';
	import { toast } from 'svelte-sonner';
	import { AccountCoState } from 'jazz-tools/svelte';
	import { IronkitAccount } from '$lib/jazz/schema';

	let { run }: { run: ResolvedProgramRun } = $props();

	const account = new AccountCoState(IronkitAccount, {
		resolve: {
			root: {
				workouts: true
			}
		}
	});

	const root = $derived(account.current.$isLoaded ? account.current.root : null);

	const template = $derived(run.programTemplate);

	const totalSessions = $derived(template.programWorkouts.length);

	const completedSessions = $derived(
		run.programRunSessions.filter((s) => s.workoutId || s.skippedAt).length
	);

	const nextSessionData = $derived.by(() => {
		const completedWorkoutIds = new Set(
			run.programRunSessions
				.filter((s) => s.workoutId || s.skippedAt)
				.map((s) => s.programWorkoutId)
		);

		const sortedWorkouts = template.programWorkouts.toSorted((a, b) => {
			if (a.weekNumber !== b.weekNumber) {
				return a.weekNumber - b.weekNumber;
			}
			return a.slotOrder - b.slotOrder;
		});

		return sortedWorkouts.find((w) => !completedWorkoutIds.has(w.$jazz.id)) ?? null;
	});

	const isCompleted = $derived(!nextSessionData);

	const sessionLabel = $derived(
		nextSessionData
			? `Week ${nextSessionData.weekNumber} · ${nextSessionData.label ?? nextSessionData.trackKey}`
			: null
	);

	const progressLabel = $derived(
		isCompleted
			? `${completedSessions} of ${totalSessions} sessions completed`
			: `Session ${completedSessions + 1} of ${totalSessions}`
	);

	const handleStartWorkout = () => {
		if (!nextSessionData || !root) {
			return;
		}

		const workout = createWorkoutFromProgramWorkout(nextSessionData);
		workout.$jazz.set('programRun', run);

		const session = ProgramRunSession.create({
			programRunId: run.$jazz.id,
			programWorkoutId: nextSessionData.$jazz.id,
			workoutId: workout.$jazz.id
		});

		run.programRunSessions.$jazz.push(session);
		root.workouts.$jazz.push(workout);

		goto(resolve('/(app)/tools/training-log/workout-[id]', { id: workout.$jazz.id }));
	};

	const handleSkipSession = () => {
		if (!nextSessionData) {
			return;
		}
		const session = ProgramRunSession.create({
			programRunId: run.$jazz.id,
			programWorkoutId: nextSessionData.$jazz.id,
			skippedAt: new Date()
		});

		run.programRunSessions.$jazz.push(session);

		toast.success('Session skipped');
	};

	const handleViewProgram = () => {
		goto(resolve('/(app)/tools/training-log/program-template-[id]', { id: template.$jazz.id }));
	};

	const handleViewRun = () => {
		goto(resolve('/(app)/tools/training-log/program-run-[id]', { id: run.$jazz.id }));
	};

	const handlePauseProgram = () => {
		run.$jazz.set('status', 'paused');
		toast.success('Program paused');
	};
</script>

<article class={['bg-card rounded-xl border p-5']}>
	<div class="flex items-start justify-between gap-3">
		<div class="min-w-0 flex-1">
			<h2 class="truncate text-lg font-bold">{template.name}</h2>
			{#if sessionLabel}
				<p class="text-muted-foreground mt-1 text-sm">{sessionLabel}</p>
			{:else}
				<p class="text-muted-foreground mt-1 text-sm">Program completed</p>
			{/if}
			<p class="text-muted-foreground mt-0.5 text-xs tabular-nums">{progressLabel}</p>
		</div>

		<DropdownMenu.Root>
			<DropdownMenu.Trigger
				class={cn(
					buttonVariants({ variant: 'ghost', size: 'icon' }),
					'text-muted-foreground size-8 shrink-0'
				)}
				aria-label={`Actions for ${template.name}`}
			>
				<EllipsisVerticalIcon class="size-4" />
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end">
				{#if !isCompleted}
					<DropdownMenu.Item onSelect={handleSkipSession}>
						<FastForwardIcon />
						Skip session
					</DropdownMenu.Item>
				{/if}
				<DropdownMenu.Item onSelect={handleViewRun}>
					<EyeIcon />
					View current run
				</DropdownMenu.Item>
				<DropdownMenu.Item onSelect={handleViewProgram}>
					<NotebookPenIcon />
					View program
				</DropdownMenu.Item>
				<DropdownMenu.Item onSelect={handlePauseProgram}>
					<PauseIcon />
					Pause program
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>

	{#if !isCompleted}
		<Button size="lg" class="mt-4 w-full" onclick={handleStartWorkout}>
			<PlayIcon />
			Start Workout
		</Button>
	{/if}
</article>
