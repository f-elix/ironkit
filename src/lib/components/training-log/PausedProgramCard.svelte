<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { api } from '$convex/_generated/api';
	import type { Doc } from '$convex/_generated/dataModel';
	import { Button, buttonVariants } from '$lib/shadcn/button';
	import * as DropdownMenu from '$lib/shadcn/dropdown-menu';
	import { cn } from '$lib/shadcn/utils';
	import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import PlayIcon from '@lucide/svelte/icons/play';
	import XIcon from '@lucide/svelte/icons/x';
	import { useConvexClient } from 'convex-svelte';
	import { toast } from 'svelte-sonner';

	let {
		run,
		template,
		totalSessions,
		completedSessions
	}: {
		run: Doc<'programRuns'>;
		template: Doc<'programTemplates'>;
		totalSessions: number;
		completedSessions: number;
	} = $props();

	const client = useConvexClient();

	let isResuming = $state(false);
	let isCanceling = $state(false);

	const progressLabel = $derived(`Session ${completedSessions + 1} of ${totalSessions}`);

	const handleResumeProgram = async () => {
		if (isResuming) {
			return;
		}
		isResuming = true;
		try {
			await client.mutation(api.programRuns.resumeRun, {
				id: run._id
			});
			toast.success('Program resumed');
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Could not resume program.');
		} finally {
			isResuming = false;
		}
	};

	const handleViewProgram = () => {
		goto(resolve('/(app)/tools/training-log/program-run-[id]', { id: run._id }));
	};

	const handleCancelProgram = async () => {
		if (isCanceling) {
			return;
		}
		isCanceling = true;
		try {
			await client.mutation(api.programRuns.cancelRun, {
				id: run._id
			});
			toast.success('Program canceled');
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Could not cancel program.');
		} finally {
			isCanceling = false;
		}
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
				<DropdownMenu.Item onSelect={handleCancelProgram} disabled={isCanceling}>
					<XIcon />
					Cancel program
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>

	<Button
		variant="secondary"
		size="lg"
		class="mt-4 w-full"
		onclick={handleResumeProgram}
		disabled={isResuming}
	>
		<PlayIcon />
		{isResuming ? 'Resuming...' : 'Resume'}
	</Button>
</article>
