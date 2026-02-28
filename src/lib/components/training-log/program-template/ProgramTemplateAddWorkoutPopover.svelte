<script lang="ts">
	import { getProgramTemplateEditorContext } from '$lib/components/training-log/program-template/program-template-editor.context.svelte.js';
	import {
		getTrackColor,
		normalizeTrackKey
	} from '$lib/components/training-log/program-template/program-template-track.utils';
	import { ProgramWorkout, PerformanceGroup, Performance, PerformanceSet } from '$lib/jazz/schema';
	import type {
		ProgramWorkout as ProgramWorkoutType,
		ResolvedProgramTemplate
	} from '$lib/jazz/types';
	import type { ResolvedProgramWorkout } from '$lib/jazz/workout';
	import Button from '$lib/shadcn/button/button.svelte';
	import Input from '$lib/shadcn/input/input.svelte';
	import * as Popover from '$lib/shadcn/popover';
	import PlusIcon from '@lucide/svelte/icons/plus';

	type CreateWorkoutMode = 'scratch' | 'copy';

	const editorState = getProgramTemplateEditorContext();

	let {
		weekNumber,
		defaultTrackKey,
		canCopyPrior,
		template
	}: {
		weekNumber: number;
		defaultTrackKey: string;
		canCopyPrior: (trackKey: string) => boolean;
		template: ResolvedProgramTemplate | undefined;
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

	const createWorkout = (mode: CreateWorkoutMode): boolean => {
		if (!template) {
			return false;
		}

		const normalizedTrackKey = normalizeTrackKey(trackKey);
		const workoutLabel = title.trim() || undefined;

		let newWorkout;

		if (mode === 'copy') {
			const previousWorkout = template.programWorkouts
				.filter(
					(w: ProgramWorkoutType) =>
						w.weekNumber < weekNumber && normalizeTrackKey(w.trackKey) === normalizedTrackKey
				)
				.toSorted((a: ProgramWorkoutType, b: ProgramWorkoutType) => b.weekNumber - a.weekNumber)[0];

			if (!previousWorkout) {
				return false;
			}

			const resolvedPrevious = previousWorkout as ResolvedProgramWorkout;
			const newGroups = resolvedPrevious.performanceGroups.map((group) => {
				const performances = group.performances.map((performance) => {
					const sets = performance.performanceSets.map((set) =>
						PerformanceSet.create({
							weight: set.weight,
							reps: set.reps,
							durationSeconds: set.durationSeconds,
							note: set.note,
							performanceOrder: set.performanceOrder,
							updatedAt: new Date()
						})
					);
					return Performance.create({
						performanceGroupId: '',
						exercise: performance.exercise,
						performanceSets: sets,
						groupOrder: performance.groupOrder,
						note: performance.note,
						programTargets: performance.programTargets,
						weightUnit: performance.weightUnit,
						updatedAt: new Date()
					});
				});
				return PerformanceGroup.create({
					workoutId: undefined,
					programWorkoutId: '',
					label: group.label,
					workoutOrder: group.workoutOrder,
					updatedAt: new Date(),
					performances
				});
			});
			newWorkout = ProgramWorkout.create({
				programTemplateId: editorState.templateId,
				weekNumber,
				slotOrder: 0,
				trackKey: normalizedTrackKey,
				label: previousWorkout.label,
				notes: previousWorkout.notes,
				performanceGroups: newGroups,
				updatedAt: new Date()
			});
		} else {
			newWorkout = ProgramWorkout.create({
				programTemplateId: editorState.templateId,
				weekNumber,
				slotOrder: 0,
				trackKey: normalizedTrackKey,
				label: workoutLabel,
				notes: undefined,
				performanceGroups: [],
				updatedAt: new Date()
			});
		}

		newWorkout.performanceGroups.forEach((group) => {
			group.$jazz.set('programWorkoutId', newWorkout.$jazz.id);
			group.performances.forEach((performance) => {
				performance.$jazz.set('performanceGroupId', group.$jazz.id);
			});
		});

		template.programWorkouts.$jazz.push(newWorkout);
		template.$jazz.set('updatedAt', new Date());
		editorState.selectWorkout(newWorkout.$jazz.id);
		return true;
	};

	const handleCreate = (mode: CreateWorkoutMode) => {
		const wasCreated = createWorkout(mode);
		if (wasCreated) {
			isOpen = false;
		}
	};

	const handleSubmit = (e: Event) => {
		e.preventDefault();
		handleCreate('scratch');
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
				<Button type="submit" size="sm" class="flex-1">Create</Button>
				{#if canCopyPrior(trackKey)}
					<Button size="sm" variant="outline" class="flex-1" onclick={() => handleCreate('copy')}>
						Copy prior
					</Button>
				{/if}
			</div>
		</form>
	</Popover.Content>
</Popover.Root>
