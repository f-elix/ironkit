<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { api } from '$convex/_generated/api';
	import { getProgramTemplateEditorContext } from '$lib/components/training-log/program-template/program-template-editor.context.svelte.js';
	import Button from '$lib/shadcn/button/button.svelte';
	import { buttonVariants } from '$lib/shadcn/button';
	import * as Tooltip from '$lib/shadcn/tooltip';
	import { cn } from '$lib/shadcn/utils';
	import {
		canStartProgramTemplate,
		getProgramTemplateStartDisabledReason,
		type ProgramTemplateStatus
	} from '$lib/training-log/program-template-status';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import PlayIcon from '@lucide/svelte/icons/play';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { toast } from 'svelte-sonner';

	let { status }: { status: ProgramTemplateStatus } = $props();

	const editorState = getProgramTemplateEditorContext();
	const client = useConvexClient();

	const activeRunQuery = useQuery(api.programRuns.getActiveRun, {});
	const workoutsQuery = useQuery(api.programWorkouts.listByTemplate, () => ({
		programTemplateId: editorState.templateId
	}));

	const activeRun = $derived(activeRunQuery.data ?? null);
	const workouts = $derived(workoutsQuery.data ?? []);
	const workoutCount = $derived(workouts.length);

	const activeRunForThisTemplate = $derived(
		activeRun?.programTemplateId === editorState.templateId ? activeRun : null
	);
	const hasOtherActiveRun = $derived(activeRun !== null && activeRunForThisTemplate === null);
	const canStart = $derived(
		canStartProgramTemplate({
			status,
			workoutCount,
			hasActiveRunForTemplate: !!activeRunForThisTemplate
		})
	);
	const startDisabledReason = $derived(
		getProgramTemplateStartDisabledReason({
			status,
			workoutCount
		})
	);

	const viewActiveRunHref = $derived(
		activeRunForThisTemplate
			? resolve('/(app)/tools/training-log/program-run-[id]', { id: activeRunForThisTemplate._id })
			: null
	);

	let isActivating = $state(false);

	const handleStart = async () => {
		if (!canStart || isActivating) {
			return;
		}

		if (hasOtherActiveRun) {
			const confirmed = window.confirm(
				'Starting this will replace your current program. Continue?'
			);
			if (!confirmed) {
				return;
			}
		}

		isActivating = true;
		try {
			await client.mutation(api.programRuns.activateTemplate, {
				programTemplateId: editorState.templateId
			});
			toast.success('Program started');
			goto(resolve('/(app)/tools/training-log'));
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Could not start program.');
		} finally {
			isActivating = false;
		}
	};
</script>

{#if viewActiveRunHref}
	<Button href={viewActiveRunHref} variant="secondary" size="sm" class="h-7 gap-1 px-2 text-xs">
		<EyeIcon class="size-3.5" />
		View Run
	</Button>
{:else if canStart}
	<Button
		variant="secondary"
		size="sm"
		class="h-7 gap-1 px-2 text-xs"
		disabled={isActivating}
		onclick={handleStart}
	>
		<PlayIcon class="size-3.5" />
		{isActivating ? 'Starting...' : 'Start'}
	</Button>
{:else}
	<Tooltip.Provider>
		<Tooltip.Root>
			<Tooltip.Trigger
				class={cn(
					buttonVariants({ variant: 'secondary', size: 'sm' }),
					'h-7 gap-1 px-2 text-xs opacity-50'
				)}
				disabled
			>
				<PlayIcon class="size-3.5" />
				Start
			</Tooltip.Trigger>
			<Tooltip.Content>{startDisabledReason}</Tooltip.Content>
		</Tooltip.Root>
	</Tooltip.Provider>
{/if}
