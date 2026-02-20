<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { api } from '$convex/_generated/api';
	import type { Doc, Id } from '$convex/_generated/dataModel';
	import { Button, buttonVariants } from '$lib/shadcn/button';
	import * as DropdownMenu from '$lib/shadcn/dropdown-menu';
	import { cn } from '$lib/shadcn/utils';
	import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import FastForwardIcon from '@lucide/svelte/icons/fast-forward';
	import PauseIcon from '@lucide/svelte/icons/pause';
	import PlayIcon from '@lucide/svelte/icons/play';
	import { useConvexClient } from 'convex-svelte';
	import { toast } from 'svelte-sonner';

	interface NextSession {
		weekNumber: number;
		label?: string;
		trackKey: string;
	}

	let {
		run,
		template,
		nextSession,
		totalSessions,
		completedSessions
	}: {
		run: Doc<'programRuns'>;
		template: Doc<'programTemplates'>;
		nextSession: NextSession | null;
		totalSessions: number;
		completedSessions: number;
	} = $props();

	const client = useConvexClient();

	let isStarting = $state(false);
	let isSkipping = $state(false);
	let isPausing = $state(false);

	const sessionLabel = $derived(
		nextSession
			? `Week ${nextSession.weekNumber} · ${nextSession.label ?? nextSession.trackKey}`
			: null
	);

	const progressLabel = $derived(
		`Session ${completedSessions + 1} of ${totalSessions}`
	);

	const handleStartWorkout = async () => {
		if (isStarting || !nextSession) return;
		isStarting = true;
		try {
			const result = await client.mutation(api.programRunSessions.startNextAsWorkout, {
				programRunId: run._id
			});
			if (result) {
				goto(resolve('/(app)/tools/training-log/workout-[id]', { id: result.workoutId }));
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Could not start workout.');
		} finally {
			isStarting = false;
		}
	};

	const handleSkipSession = async () => {
		if (isSkipping || !nextSession) return;
		isSkipping = true;
		try {
			await client.mutation(api.programRunSessions.skipNext, {
				programRunId: run._id
			});
			toast.success('Session skipped');
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Could not skip session.');
		} finally {
			isSkipping = false;
		}
	};

	const handleViewProgram = () => {
		goto(`/tools/training-log/program-run-${run._id}`);
	};

	const handlePauseProgram = async () => {
		if (isPausing) return;
		isPausing = true;
		try {
			await client.mutation(api.programRuns.pauseRun, {
				id: run._id
			});
			toast.success('Program paused');
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Could not pause program.');
		} finally {
			isPausing = false;
		}
	};

	const isCompleted = $derived(!nextSession);
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
					<DropdownMenu.Item onSelect={handleSkipSession} disabled={isSkipping}>
						<FastForwardIcon />
						Skip session
					</DropdownMenu.Item>
				{/if}
				<DropdownMenu.Item onSelect={handleViewProgram}>
					<EyeIcon />
					View program
				</DropdownMenu.Item>
				<DropdownMenu.Item onSelect={handlePauseProgram} disabled={isPausing}>
					<PauseIcon />
					Pause program
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>

	{#if !isCompleted}
		<Button
			size="lg"
			class="mt-4 w-full"
			onclick={handleStartWorkout}
			disabled={isStarting}
		>
			<PlayIcon />
			{isStarting ? 'Starting...' : 'Start Workout'}
		</Button>
	{/if}
</article>
