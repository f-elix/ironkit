import type { Id } from '$convex/_generated/dataModel';
import { getContext, setContext } from 'svelte';

class ProgramTemplateEditorState {
	templateId: Id<'programTemplates'>;
	selectedWorkoutId = $state<Id<'programWorkouts'> | undefined>(undefined);
	sheetOpen = $state(false);

	constructor(templateId: Id<'programTemplates'>) {
		this.templateId = templateId;
	}

	selectWorkout = (id: Id<'programWorkouts'>) => {
		this.selectedWorkoutId = id;
		this.sheetOpen = true;
	};

	clearSelection = () => {
		this.selectedWorkoutId = undefined;
		this.sheetOpen = false;
	};

	setSheetOpen = (open: boolean) => {
		this.sheetOpen = open;
		if (!open) {
			this.selectedWorkoutId = undefined;
		}
	};
}

const programTemplateEditorContextKey = Symbol('program-template-editor');

export const setProgramTemplateEditorContext = (templateId: Id<'programTemplates'>) => {
	return setContext(programTemplateEditorContextKey, new ProgramTemplateEditorState(templateId));
};

export const getProgramTemplateEditorContext = () => {
	return getContext<ProgramTemplateEditorState>(programTemplateEditorContextKey);
};
