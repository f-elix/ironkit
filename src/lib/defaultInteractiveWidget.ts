const INTERACTIVE_WIDGET_CONTENT = 'interactive-widget=resizes-content';

/**
 * This app has 'interactive-widget=resizes-content' set in the viewport meta tag to avoid
 * pushing content outside the viewport when the virutal keyboard is open on mobile devices.
 * This doesn't play well with everything, so this functions offers a way to temporarily revert to the default
 * browser behavior.
 * @returns A function that sets 'resizes-content' back on the meta tag.
 */
export const defaultInteractiveWidget = () => {
	const metaTag = document.querySelector('meta[name="viewport"]');
	if (!metaTag) {
		return;
	}
	const content = metaTag.getAttribute('content') ?? '';
	const newContent = content.replace(INTERACTIVE_WIDGET_CONTENT, '');
	if (newContent) {
		metaTag.setAttribute('content', newContent);
	}
	return () => {
		metaTag.setAttribute('content', content);
	};
};
