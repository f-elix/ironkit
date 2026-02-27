import { getContext, setContext } from 'svelte';

class ProgramTemplateEditorState {
	templateId: string;
	selectedWorkoutId = $state<string | undefined>(undefined);
	sheetOpen = $state(false);

	constructor(templateId: string) {
		this.templateId = templateId;
	}

	selectWorkout = (id: string) => {
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

export const setProgramTemplateEditorContext = (templateId: string) => {
	return setContext(programTemplateEditorContextKey, new ProgramTemplateEditorState(templateId));
};

export const getProgramTemplateEditorContext = () => {
	return getContext<ProgramTemplateEditorState>(programTemplateEditorContextKey);
};
