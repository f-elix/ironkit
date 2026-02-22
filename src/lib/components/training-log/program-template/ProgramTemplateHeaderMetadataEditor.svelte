<script lang="ts">
	import type { Doc } from '$convex/_generated/dataModel';
	import { api } from '$convex/_generated/api';
	import ProgramTemplateHeaderNotesPopover from '$lib/components/training-log/program-template/ProgramTemplateHeaderNotesPopover.svelte';
	import ProgramTemplateHeaderRunAction from '$lib/components/training-log/program-template/ProgramTemplateHeaderRunAction.svelte';
	import ProgramTemplateHeaderSaveIndicator from '$lib/components/training-log/program-template/ProgramTemplateHeaderSaveIndicator.svelte';
	import ProgramTemplateHeaderStatusMenu from '$lib/components/training-log/program-template/ProgramTemplateHeaderStatusMenu.svelte';
	import { getProgramTemplateHeaderSaveContext } from '$lib/components/training-log/program-template/program-template-header-save.context.svelte';
	import Input from '$lib/shadcn/input/input.svelte';
	import { useConvexClient } from 'convex-svelte';
	import { toast } from 'svelte-sonner';

	let { template }: { template: Doc<'programTemplates'> } = $props();

	type ProgramTemplateMetadataDraft = {
		name?: string;
		totalWeeks?: number;
	};

	const client = useConvexClient();
	const saveController = getProgramTemplateHeaderSaveContext();
	let draft = $state<ProgramTemplateMetadataDraft>({});

	let nameValue = $derived(draft.name ?? template.name ?? '');
	let totalWeeksValue = $derived(draft.totalWeeks ?? template.totalWeeks ?? 1);

	const normalizePositiveInt = (value: number, fallback = 1) => {
		if (!Number.isFinite(value)) {
			return fallback;
		}
		return Math.max(1, Math.floor(value));
	};

	const buildPayload = () => ({
		name: nameValue.trim() || 'Untitled program',
		totalWeeks: normalizePositiveInt(totalWeeksValue, 1)
	});

	const hasChanges = () => {
		const payload = buildPayload();
		return (
			payload.name !== (template.name.trim() || 'Untitled program') ||
			payload.totalWeeks !== normalizePositiveInt(template.totalWeeks, 1)
		);
	};

	const save = async () => {
		const payload = buildPayload();
		try {
			await saveController.run(async () => {
				await client.mutation(api.programTemplates.update, {
					id: template._id,
					...payload
				});
			});
			draft = payload;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Could not save template.');
		}
	};

	const setField = <K extends keyof ProgramTemplateMetadataDraft>(
		field: K,
		value: ProgramTemplateMetadataDraft[K]
	) => {
		draft = { ...draft, [field]: value };
		saveController.queueDebounced('template-metadata', {
			shouldSave: hasChanges,
			save
		});
	};

	const flushSave = () => {
		saveController.flushDebounced('template-metadata', {
			shouldSave: hasChanges,
			save
		});
	};
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
		<div class="hidden md:block">
			<ProgramTemplateHeaderSaveIndicator />
		</div>

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

		<ProgramTemplateHeaderStatusMenu templateId={template._id} status={template.status} />

		<ProgramTemplateHeaderRunAction status={template.status} />

		<ProgramTemplateHeaderNotesPopover templateId={template._id} notes={template.notes} />

		<div class="md:hidden">
			<ProgramTemplateHeaderSaveIndicator />
		</div>
	</div>
</header>
