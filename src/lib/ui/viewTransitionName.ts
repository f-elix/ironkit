import { textToId } from '$lib/strings/textToId';

export const viewTransitionName = (text: Maybe<string>) => {
	if (!text) {
		return '';
	}
	return textToId(text);
};
