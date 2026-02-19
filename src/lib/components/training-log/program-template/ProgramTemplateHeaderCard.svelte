<script lang="ts">
	import { api } from '$convex/_generated/api';
	import type { Doc } from '$convex/_generated/dataModel';
	import type {
		ProgramTemplateDraft,
		ProgramTemplateStatus
	} from '$lib/components/training-log/program-template/program-template-editor.types';
	import Badge from '$lib/shadcn/badge/badge.svelte';
	import Input from '$lib/shadcn/input/input.svelte';
	import * as Popover from '$lib/shadcn/popover';
	import { Textarea } from '$lib/shadcn/textarea';
	import CheckIcon from '@lucide/svelte/icons/check';
	import LoaderIcon from '@lucide/svelte/icons/loader';
	import StickyNoteIcon from '@lucide/svelte/icons/sticky-note';
	import { useConvexClient } from 'convex-svelte';
	import { onDestroy } from 'svelte';
	import { toast } from 'svelte-sonner';

	let { template }: { template: Doc<'programTemplates'> } = $props();

	const client = useConvexClient();

	let draft = $state<ProgramTemplateDraft>({});
	let saveTimer: ReturnType<typeof setTimeout> | undefined;
	let savedTimer: ReturnType<typeof setTimeout> | undefined;
	let saveStatus = $state<'idle' | 'saving' | 'saved'>('idle');

	let nameValue = $derived(draft.name ?? template.name);
	let notesValue = $derived(draft.notes ?? template.notes ?? '');
	let totalWeeksValue = $derived(draft.totalWeeks ?? template.totalWeeks);
	let statusValue = $derived((draft.status ?? template.status) as ProgramTemplateStatus);

	const normalizePositiveInt = (value: number, fallback = 1) => {
		if (!Number.isFinite(value)) {
			return fallback;
		}
		return Math.max(1, Math.floor(value));
	};

	const buildPayload = () => ({
		name: nameValue.trim() || 'Untitled program',
		notes: notesValue.trim(),
		totalWeeks: normalizePositiveInt(totalWeeksValue, 1),
		status: statusValue
	});

	const hasChanges = () => {
		const payload = buildPayload();
		return (
			payload.name !== (template.name.trim() || 'Untitled program') ||
			payload.notes !== (template.notes ?? '').trim() ||
			payload.totalWeeks !== normalizePositiveInt(template.totalWeeks, 1) ||
			payload.status !== template.status
		);
	};

	const save = async (statusOverride?: ProgramTemplateStatus) => {
		const payload = {
			...buildPayload(),
			...(statusOverride ? { status: statusOverride } : {})
		};
		saveStatus = 'saving';
		try {
			await client.mutation(api.programTemplates.update, {
				id: template._id,
				...payload
			});
			draft = payload;
			saveStatus = 'saved';
			if (savedTimer) {
				clearTimeout(savedTimer);
			}
			savedTimer = setTimeout(() => {
				if (saveStatus === 'saved') {
					saveStatus = 'idle';
				}
			}, 2000);
		} catch (error) {
			saveStatus = 'idle';
			toast.error(error instanceof Error ? error.message : 'Could not save template.');
		}
	};

	const queueSave = () => {
		if (saveTimer) {
			clearTimeout(saveTimer);
		}
		saveTimer = setTimeout(() => {
			if (hasChanges()) {
				save();
			}
		}, 500);
	};

	const setField = <K extends keyof ProgramTemplateDraft>(
		field: K,
		value: ProgramTemplateDraft[K]
	) => {
		draft = { ...draft, [field]: value };
		queueSave();
	};

	const flushSave = () => {
		if (saveTimer) {
			clearTimeout(saveTimer);
			saveTimer = undefined;
		}
		if (hasChanges()) {
			save();
		}
	};

	const toggleStatus = () => {
		const next: ProgramTemplateStatus = statusValue === 'draft' ? 'archived' : 'draft';
		draft = { ...draft, status: next };
		if (saveTimer) {
			clearTimeout(saveTimer);
		}
		save(next);
	};

	onDestroy(() => {
		if (saveTimer) {
			clearTimeout(saveTimer);
		}
		if (savedTimer) {
			clearTimeout(savedTimer);
		}
	});
</script>

<header
	class="border-border/40 bg-card/30 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border px-4 py-2.5 backdrop-blur-sm"
>
	<input
		type="text"
		value={nameValue}
		class="placeholder:text-muted-foreground min-w-0 flex-1 basis-40 bg-transparent text-base font-semibold outline-none"
		placeholder="Program name"
		oninput={(e) => setField('name', e.currentTarget.value)}
		onblur={flushSave}
	/>

	<div class="flex items-center gap-3">
		<div class="hidden md:block">{@render saveStatusIndicator()}</div>
		<div class="flex items-center gap-1.5">
			<Input
				type="number"
				min="1"
				value={totalWeeksValue}
				class="h-7 w-12 text-center text-xs tabular-nums"
				oninput={(e) =>
					setField('totalWeeks', normalizePositiveInt(e.currentTarget.valueAsNumber, 1))}
				onblur={flushSave}
			/>
			<span class="text-muted-foreground text-xs">wk</span>
		</div>

		<button type="button" onclick={toggleStatus} class="shrink-0">
			<Badge
				variant={statusValue === 'draft' ? 'outline' : 'secondary'}
				class="cursor-pointer capitalize select-none"
			>
				{statusValue}
			</Badge>
		</button>

		<Popover.Root>
			<Popover.Trigger
				class="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
			>
				<StickyNoteIcon class="size-4" />
			</Popover.Trigger>
			<Popover.Content class="w-72" align="end">
				<div class="grid gap-2">
					<span class="text-muted-foreground text-xs font-medium">Program notes</span>
					<Textarea
						rows={4}
						placeholder="Training block goals, periodization notes..."
						value={notesValue}
						oninput={(e) => setField('notes', e.currentTarget.value)}
						onblur={flushSave}
					/>
				</div>
			</Popover.Content>
		</Popover.Root>
		<div class="md:hidden">{@render saveStatusIndicator()}</div>
	</div>
</header>

{#snippet saveStatusIndicator()}
	<div class="flex h-5 w-14 items-center justify-end">
		{#if saveStatus === 'saving'}
			<span class="text-muted-foreground flex items-center gap-1 text-[11px]">
				<LoaderIcon class="size-3 animate-spin" />
				<span>Saving</span>
			</span>
		{:else if saveStatus === 'saved'}
			<span class="flex items-center gap-1 text-[11px] text-emerald-400">
				<CheckIcon class="size-3" />
				<span>Saved</span>
			</span>
		{/if}
	</div>
{/snippet}
