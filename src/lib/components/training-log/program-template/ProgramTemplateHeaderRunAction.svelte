<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
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
	import { Account, ProgramRun } from '$lib/jazz/schema';
	import { AccountCoState } from 'jazz-tools/svelte';
	import { CoState } from 'jazz-tools/svelte';
	import { ProgramTemplate } from '$lib/jazz/schema';

	let { status }: { status: ProgramTemplateStatus } = $props();

	const editorState = getProgramTemplateEditorContext();

	const account = new AccountCoState(Account, {
		resolve: {
			root: {
				programRuns: {
					$each: true
				}
			}
		}
	});

	const templateState = new CoState(ProgramTemplate, () => editorState.templateId, {
		resolve: {
			programWorkouts: { $each: true }
		}
	});

	const root = $derived(account.current.$isLoaded ? account.current.root : null);
	const template = $derived(templateState.current.$isLoaded ? templateState.current : undefined);

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

	const workouts = $derived(
		template?.$isLoaded && template.programWorkouts.$isLoaded
			? [...template.programWorkouts].filter((w) => w.$isLoaded)
			: []
	);
	const workoutCount = $derived(workouts.length);

	const activeRunForThisTemplate = $derived(
		activeRun && activeRun.programTemplate.$jazz.id === editorState.templateId ? activeRun : null
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
			? resolve('/(app)/tools/training-log/program-run-[id]', {
					id: activeRunForThisTemplate.$jazz.id
				})
			: null
	);

	const handleStart = () => {
		if (!canStart || !template || !root) {
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

		// End any existing active runs
		const existingActiveRuns = root.programRuns.filter(
			(run) => run.status === 'active' || run.status === 'paused'
		);
		existingActiveRuns.forEach((run) => {
			run.$jazz.set('status', 'completed');
			run.$jazz.set('endedAt', new Date());
		});

		// Create new active run
		const newRun = ProgramRun.create({
			programTemplate: template,
			status: 'active',
			startedAt: new Date(),
			programRunSessions: []
		});

		root.programRuns.$jazz.push(newRun);
		goto(resolve('/(app)/tools/training-log'));
	};
</script>

{#if viewActiveRunHref}
	<Button href={viewActiveRunHref} variant="secondary" size="sm" class="h-7 gap-1 px-2 text-xs">
		<EyeIcon class="size-3.5" />
		View Run
	</Button>
{:else if canStart}
	<Button variant="secondary" size="sm" class="h-7 gap-1 px-2 text-xs" onclick={handleStart}>
		<PlayIcon class="size-3.5" />
		Start
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
