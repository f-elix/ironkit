import type { Id } from '$convex/_generated/dataModel';
import { getContext, setContext } from 'svelte';
import type { Writable } from 'svelte/store';

type ProgramTemplateEditorContext = {
	selectedWorkoutIdStore: Writable<Id<'programWorkouts'> | undefined>;
};

const programTemplateEditorContextKey = Symbol('program-template-editor');

export const setProgramTemplateEditorContext = (context: ProgramTemplateEditorContext) => {
	setContext(programTemplateEditorContextKey, context);
};

export const getProgramTemplateEditorContext = () => {
	return getContext<ProgramTemplateEditorContext>(programTemplateEditorContextKey);
};
