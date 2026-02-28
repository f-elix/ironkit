import { Context } from 'runed';

class ProgramTemplateEditorState {
	templateId = $state<string>('');
	selectedWorkoutId = $state<string | undefined>(undefined);
	sheetOpen = $state(false);

	constructor(templateId: () => string) {
		this.templateId = templateId();
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

const programTemplateEditorContext = new Context<ProgramTemplateEditorState>(
	'program-template-editor'
);

export const setProgramTemplateEditorContext = (templateId: () => string) => {
	return programTemplateEditorContext.set(new ProgramTemplateEditorState(templateId));
};

export const getProgramTemplateEditorContext = () => {
	return programTemplateEditorContext.get();
};
