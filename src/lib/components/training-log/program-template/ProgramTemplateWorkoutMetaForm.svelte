<script lang="ts">
	import type { WorkoutMetaUpdate } from '$lib/components/training-log/program-template/program-template-editor.types';
	import Input from '$lib/shadcn/input/input.svelte';
	import * as Select from '$lib/shadcn/select';
	import { Textarea } from '$lib/shadcn/textarea';

	let {
		weekNumber,
		trackKey,
		label,
		notes,
		availableTrackKeys,
		onUpdate
	}: {
		weekNumber: number;
		trackKey: string;
		label: string;
		notes: string;
		availableTrackKeys: string[];
		onUpdate: (update: WorkoutMetaUpdate) => void;
	} = $props();
</script>

<div class="grid gap-3">
	<div class="grid grid-cols-2 gap-3">
		<label class="grid gap-1">
			<span class="text-muted-foreground text-[11px] font-medium">Week</span>
			<Input
				type="number"
				min="1"
				class="h-8 text-xs tabular-nums"
				value={weekNumber}
				oninput={(e) => {
					onUpdate({
						field: 'weekNumber',
						value: e.currentTarget.valueAsNumber
					});
				}}
			/>
		</label>
		<div class="grid gap-1">
			<span class="text-muted-foreground text-[11px] font-medium">Track</span>
			<Select.Root
				type="single"
				value={trackKey.toUpperCase()}
				onValueChange={(value) => {
					if (value) {
						onUpdate({ field: 'trackKey', value });
					}
				}}
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
			oninput={(e) => {
				onUpdate({
					field: 'label',
					value: e.currentTarget.value
				});
			}}
		/>
	</label>
	<label class="grid gap-1">
		<span class="text-muted-foreground text-[11px] font-medium">Notes</span>
		<Textarea
			rows={2}
			class="text-xs"
			value={notes}
			oninput={(e) => {
				onUpdate({
					field: 'notes',
					value: e.currentTarget.value
				});
			}}
		/>
	</label>
</div>
