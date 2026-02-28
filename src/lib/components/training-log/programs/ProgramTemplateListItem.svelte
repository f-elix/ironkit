<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { ProgramTemplate } from '$lib/jazz/types';
	import DeleteProgramTemplateDialog from '$lib/components/training-log/programs/DeleteProgramTemplateDialog.svelte';
	import Badge from '$lib/shadcn/badge/badge.svelte';
	import Button from '$lib/shadcn/button/button.svelte';
	import { buttonVariants } from '$lib/shadcn/button';
	import * as DropdownMenu from '$lib/shadcn/dropdown-menu';
	import * as Tooltip from '$lib/shadcn/tooltip';
	import { cn } from '$lib/shadcn/utils';
	import {
		canStartProgramTemplate,
		getProgramTemplateStartDisabledReason,
		getProgramTemplateStatusBadgeVariant
	} from '$lib/training-log/program-template-status';
	import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import PlayIcon from '@lucide/svelte/icons/play';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import {
		IronkitAccount,
		ProgramRun,
		ProgramTemplate as ProgramTemplateSchema
	} from '$lib/jazz/schema';
	import { deleteCoValues } from 'jazz-tools';
	import { AccountCoState } from 'jazz-tools/svelte';
	import { toast } from 'svelte-sonner';

	let {
		template,
		updatedAtLabel,
		workoutCount,
		activeRunId,
		hasOtherActiveRun,
		animationDelay = 0
	}: {
		template: ProgramTemplate;
		updatedAtLabel: string;
		workoutCount: number;
		activeRunId?: string;
		hasOtherActiveRun: boolean;
		animationDelay?: number;
	} = $props();

	const account = new AccountCoState(IronkitAccount, {
		resolve: {
			root: {
				programRuns: { $each: true },
				programTemplates: { $each: true }
			}
		}
	});

	const root = $derived(account.current.$isLoaded ? account.current.root : null);

	let isDeleteDialogOpen = $state(false);

	const viewActiveRunHref = $derived(
		activeRunId ? resolve('/(app)/tools/training-log/program-run-[id]', { id: activeRunId }) : null
	);

	const canStart = $derived(
		canStartProgramTemplate({
			status: template.status,
			workoutCount,
			hasActiveRunForTemplate: !!activeRunId
		})
	);
	const startDisabledReason = $derived(
		getProgramTemplateStartDisabledReason({
			status: template.status,
			workoutCount
		})
	);
	const statusBadgeVariant = $derived(getProgramTemplateStatusBadgeVariant(template.status));

	async function handleStart() {
		if (!canStart || !root) {
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
		for (const run of existingActiveRuns) {
			run.$jazz.set('status', 'completed');
			run.$jazz.set('endedAt', new Date());
		}

		// Create new active run
		const newRun = ProgramRun.create({
			programTemplate: template,
			status: 'active',
			startedAt: new Date(),
			programRunSessions: []
		});

		root.programRuns.$jazz.push(newRun);
		toast.success('Program started');
		goto(resolve('/(app)/tools/training-log'));
	}

	const openDeleteDialog = () => {
		isDeleteDialogOpen = true;
	};

	const deleteTemplate = async () => {
		if (!root) {
			return;
		}
		const templateId = template.$jazz.id;
		root.programTemplates.$jazz.remove((t) => t.$jazz.id === templateId);
		await deleteCoValues(ProgramTemplateSchema, templateId, {
			resolve: {
				programWorkouts: {
					$each: {
						performanceGroups: {
							$each: {
								performances: true
							}
						}
					}
				}
			}
		});
		isDeleteDialogOpen = false;
	};
</script>

<li
	class={[
		'group relative overflow-hidden rounded-xl border transition-all duration-200',
		'bg-card hover:border-primary/25 hover:shadow-primary/5 hover:shadow-md',
		'animate-in fade-in slide-in-from-bottom-1 duration-300 [animation-fill-mode:both]'
	]}
	style:animation-delay="{animationDelay}ms"
>
	<a
		href={resolve('/(app)/tools/training-log/program-template-[id]', { id: template.$jazz.id })}
		class="block p-4 pr-12"
	>
		<div class="flex items-center gap-2.5">
			<h3 class="min-w-0 truncate text-base font-semibold">{template.name}</h3>
			<Badge variant={statusBadgeVariant} class="shrink-0 text-[11px] tracking-wider uppercase">
				{template.status}
			</Badge>
		</div>
		<div class="text-muted-foreground mt-1.5 flex items-center gap-2 text-xs">
			<span class="tabular-nums">{template.totalWeeks} weeks</span>
			<span class="opacity-30">&middot;</span>
			<span>Updated {updatedAtLabel}</span>
		</div>
		{#if template.notes}
			<p class="text-muted-foreground/70 mt-2.5 line-clamp-2 text-sm leading-relaxed">
				{template.notes}
			</p>
		{/if}
	</a>

	<div class="absolute top-2.5 right-2 flex items-center gap-1">
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

		<DropdownMenu.Root>
			<DropdownMenu.Trigger
				class={cn(
					buttonVariants({ variant: 'ghost', size: 'icon' }),
					'text-muted-foreground size-8',
					'pointer:opacity-0 pointer:group-hover:opacity-100 pointer:focus-visible:opacity-100',
					'transition-opacity'
				)}
				aria-label={`Actions for ${template.name}`}
			>
				<EllipsisVerticalIcon class="size-4" />
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end">
				<DropdownMenu.Item variant="destructive" onSelect={openDeleteDialog}>
					<TrashIcon />
					Delete
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
</li>

<DeleteProgramTemplateDialog
	bind:open={isDeleteDialogOpen}
	{template}
	onConfirmDelete={deleteTemplate}
/>
