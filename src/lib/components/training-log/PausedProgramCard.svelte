<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { ResolvedProgramRun } from '$lib/jazz/types';
	import { Button, buttonVariants } from '$lib/shadcn/button';
	import * as DropdownMenu from '$lib/shadcn/dropdown-menu';
	import { cn } from '$lib/shadcn/utils';
	import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import PlayIcon from '@lucide/svelte/icons/play';
	import XIcon from '@lucide/svelte/icons/x';
	import { toast } from 'svelte-sonner';

	let { run }: { run: ResolvedProgramRun } = $props();

	const template = $derived(run.programTemplate);

	const totalSessions = $derived(template.programWorkouts.length);

	const completedSessions = $derived(
		run.programRunSessions.filter((s) => s.workoutId || s.skippedAt).length
	);

	const progressLabel = $derived(`Session ${completedSessions + 1} of ${totalSessions}`);

	const handleResumeProgram = () => {
		run.$jazz.set('status', 'active');
		toast.success('Program resumed');
	};

	const handleViewProgram = () => {
		goto(resolve('/(app)/tools/training-log/program-run-[id]', { id: run.$jazz.id }));
	};

	const handleCancelProgram = () => {
		run.$jazz.set('status', 'canceled');
		toast.success('Program canceled');
	};
</script>

<article class={['bg-muted/50 rounded-xl border border-dashed p-5']}>
	<div class="flex items-start justify-between gap-3">
		<div class="min-w-0 flex-1">
			<h2 class="text-muted-foreground truncate text-lg font-bold">{template.name}</h2>
			<p class="text-muted-foreground mt-1 text-sm">Paused</p>
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
				<DropdownMenu.Item onSelect={handleViewProgram}>
					<EyeIcon />
					View program
				</DropdownMenu.Item>
				<DropdownMenu.Item onSelect={handleCancelProgram}>
					<XIcon />
					Cancel program
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>

	<Button variant="secondary" size="lg" class="mt-4 w-full" onclick={handleResumeProgram}>
		<PlayIcon />
		Resume
	</Button>
</article>
