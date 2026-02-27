<script lang="ts">
	import type { CreateWorkoutMode } from '$lib/components/training-log/program-template/program-template-editor.types';
	import { getTrackColor } from '$lib/components/training-log/program-template/program-template-track.utils';
	import Button from '$lib/shadcn/button/button.svelte';
	import Input from '$lib/shadcn/input/input.svelte';
	import * as Popover from '$lib/shadcn/popover';
	import PlusIcon from '@lucide/svelte/icons/plus';

	type CreateWorkoutPayload = {
		mode: CreateWorkoutMode;
		weekNumber: number;
		trackKey: string;
		label: string;
	};

	let {
		weekNumber,
		defaultTrackKey,
		canCopyPrior,
		onCreate
	}: {
		weekNumber: number;
		defaultTrackKey: string;
		canCopyPrior: (trackKey: string) => boolean;
		onCreate: (payload: CreateWorkoutPayload) => boolean;
	} = $props();

	let isOpen = $state(false);
	let title = $state('');
	let trackKey = $state('');

	const resetDraft = () => {
		trackKey = defaultTrackKey;
		title = '';
	};

	const handleOpenChange = (open: boolean) => {
		isOpen = open;
		if (open) {
			resetDraft();
		}
	};

	const createWorkout = (mode: CreateWorkoutMode) => {
		const wasCreated = onCreate({
			mode,
			weekNumber,
			trackKey,
			label: title
		});
		if (wasCreated) {
			isOpen = false;
		}
	};

	const handleSubmit = (e: Event) => {
		e.preventDefault();
		createWorkout('scratch');
	};
</script>

<Popover.Root open={isOpen} onOpenChange={handleOpenChange}>
	<Popover.Trigger
		class="border-border/25 text-muted-foreground/50 hover:border-border/50 hover:bg-card/15 hover:text-muted-foreground flex size-[4.25rem] shrink-0 items-center justify-center rounded-lg border border-dashed transition-colors sm:size-[5rem]"
	>
		<PlusIcon class="size-4" />
	</Popover.Trigger>
	<Popover.Content class="w-56" align="start">
		<form class="grid gap-3" onsubmit={handleSubmit}>
			<div class="flex items-center gap-2">
				<p class="text-sm font-medium">Week {weekNumber}</p>
				<span
					class={[
						'rounded border px-1.5 py-px text-[10px] font-bold tracking-wider uppercase',
						getTrackColor(trackKey)
					]}
				>
					{trackKey}
				</span>
			</div>
			<label class="grid gap-1">
				<span class="text-muted-foreground text-[11px]">Title</span>
				<Input
					value={title}
					placeholder="e.g. Upper body"
					class="h-7 text-xs"
					oninput={(e) => {
						title = e.currentTarget.value;
					}}
				/>
			</label>
			<div class="flex gap-2">
				<Button size="sm" class="flex-1">Create</Button>
				{#if canCopyPrior(trackKey)}
					<Button
						type="button"
						size="sm"
						variant="outline"
						class="flex-1"
						onclick={() => createWorkout('copy')}
					>
						Copy prior
					</Button>
				{/if}
			</div>
		</form>
	</Popover.Content>
</Popover.Root>
