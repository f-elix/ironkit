<script lang="ts">
	import { getProgramTemplateEditorContext } from '$lib/components/training-log/program-template/program-template-editor.context.svelte.js';
	import {
		getFirstAvailableTrackKey,
		normalizeTrackKey
	} from '$lib/components/training-log/program-template/program-template-track.utils';
	import Input from '$lib/shadcn/input/input.svelte';
	import * as Select from '$lib/shadcn/select';
	import { Textarea } from '$lib/shadcn/textarea';
	import { CoState } from 'jazz-tools/svelte';
	import { ProgramTemplate } from '$lib/jazz/schema';

	const editorState = getProgramTemplateEditorContext();

	const templateState = new CoState(ProgramTemplate, () => editorState.templateId, {
		resolve: {
			programWorkouts: {
				$each: {
					performanceGroups: {
						$each: {
							performances: {
								$each: {
									exercise: true,
									performanceSets: { $each: true }
								}
							}
						}
					}
				}
			}
		}
	});

	const template = $derived(templateState.current.$isLoaded ? templateState.current : undefined);
	const workouts = $derived(template?.programWorkouts ?? []);
	const selectedWorkoutId = $derived(editorState.selectedWorkoutId);
	const selectedWorkout = $derived(workouts.find((w) => w.$jazz.id === selectedWorkoutId));

	const weekNumber = $derived(selectedWorkout?.weekNumber ?? 1);
	const trackKey = $derived(selectedWorkout?.trackKey ?? 'A');
	const label = $derived(selectedWorkout?.label ?? '');
	const notes = $derived(selectedWorkout?.notes ?? '');

	const getNextAvailableTrack = (week: number): string | null => {
		const usedInWeek = new Set(
			workouts
				.filter(
					(workout) =>
						workout.weekNumber === week &&
						selectedWorkoutId &&
						workout.$jazz.id !== selectedWorkoutId
				)
				.map((workout) => normalizeTrackKey(workout.trackKey))
		);
		const allTracks = new Set(workouts.map((workout) => normalizeTrackKey(workout.trackKey)));

		for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
			if (!usedInWeek.has(letter) && !allTracks.has(letter)) {
				return letter;
			}
		}

		return null;
	};

	const availableTrackKeys = $derived.by(() => {
		const currentWeek = weekNumber;
		const currentTrackKey = normalizeTrackKey(trackKey);
		const allTracks = [
			...new Set(workouts.map((workout) => normalizeTrackKey(workout.trackKey)))
		].toSorted();
		const takenInWeek = new Set(
			workouts
				.filter(
					(workout) =>
						workout.weekNumber === currentWeek &&
						selectedWorkoutId &&
						workout.$jazz.id !== selectedWorkoutId
				)
				.map((workout) => normalizeTrackKey(workout.trackKey))
		);

		const available = allTracks.filter((track) => !takenInWeek.has(track));
		if (!available.includes(currentTrackKey)) {
			available.push(currentTrackKey);
		}

		const nextTrack = getNextAvailableTrack(currentWeek) ?? getFirstAvailableTrackKey(takenInWeek);
		if (!available.includes(nextTrack)) {
			available.push(nextTrack);
		}

		return available.toSorted();
	});

	const normalizePositiveInt = (value: number, fallback = 1) => {
		if (!Number.isFinite(value)) {
			return fallback;
		}
		return Math.max(1, Math.floor(value));
	};

	const setWeekNumber = (value: number) => {
		if (!selectedWorkout) {
			return;
		}
		selectedWorkout.$jazz.set('weekNumber', normalizePositiveInt(value, 1));
	};

	const setTrackKey = (value: string) => {
		if (!selectedWorkout) {
			return;
		}
		selectedWorkout.$jazz.set('trackKey', normalizeTrackKey(value));
	};

	const setLabel = (value: string) => {
		if (!selectedWorkout) {
			return;
		}
		selectedWorkout.$jazz.set('label', value.trim());
	};

	const setNotes = (value: string) => {
		if (!selectedWorkout) {
			return;
		}
		selectedWorkout.$jazz.set('notes', value.trim());
	};
</script>

{#if selectedWorkout}
	<div class="grid gap-3">
		<div class="grid grid-cols-2 gap-3">
			<label class="grid gap-1">
				<span class="text-muted-foreground text-[11px] font-medium">Week</span>
				<Input
					type="number"
					min="1"
					class="h-8 text-xs tabular-nums"
					value={weekNumber}
					oninput={(e) => setWeekNumber(e.currentTarget.valueAsNumber)}
				/>
			</label>
			<div class="grid gap-1">
				<span class="text-muted-foreground text-[11px] font-medium">Track</span>
				<Select.Root
					type="single"
					value={trackKey.toUpperCase()}
					onValueChange={(value) => value && setTrackKey(value)}
				>
					<Select.Trigger class="h-8 text-xs font-bold uppercase">
						{trackKey}
					</Select.Trigger>
					<Select.Content>
						{#each availableTrackKeys as track (track)}
							<Select.Item value={track} class="text-xs font-bold uppercase">
								{track}
								{#if track === trackKey.toUpperCase()}
									<span class="text-muted-foreground ml-1 font-normal">(current)</span>
								{/if}
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
		</div>
		<label class="grid gap-1">
			<span class="text-muted-foreground text-[11px] font-medium">Title</span>
			<Input
				class="h-8 text-xs"
				placeholder="e.g. Upper body strength"
				value={label}
				oninput={(e) => setLabel(e.currentTarget.value)}
			/>
		</label>
		<label class="grid gap-1">
			<span class="text-muted-foreground text-[11px] font-medium">Notes</span>
			<Textarea
				rows={2}
				class="text-xs"
				value={notes}
				oninput={(e) => setNotes(e.currentTarget.value)}
			/>
		</label>
	</div>
{/if}
