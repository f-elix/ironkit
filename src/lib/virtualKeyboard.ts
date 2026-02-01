const INTERACTIVE_WIDGET_CONTENT = 'interactive-widget=resizes-content';

/**
 * Control virtual keyboard behavior with progressive enhancement.
 *
 * Uses the VirtualKeyboard API when available (Chromium 94+), falling back to
 * viewport meta tag manipulation for Safari/Firefox.
 *
 * By default, this app has 'interactive-widget=resizes-content' set in the viewport
 * meta tag to resize the viewport when the virtual keyboard opens. Call this function
 * with `true` to let the keyboard overlay content instead (useful in dialogs where
 * users need to scroll to see inputs).
 *
 * @param overlays - If true, keyboard overlays content. If false, viewport resizes.
 * @returns A cleanup function that restores the previous behavior.
 */
export function setKeyboardOverlaysContent(overlays: boolean): () => void {
	// Modern approach: VirtualKeyboard API (Chromium only)
	const vk = navigator.virtualKeyboard;
	if (vk) {
		const previous = vk.overlaysContent;
		vk.overlaysContent = overlays;
		return () => {
			vk.overlaysContent = previous;
		};
	}

	// Fallback: viewport meta tag manipulation (for Safari/Firefox)
	const meta = document.querySelector('meta[name="viewport"]');
	if (!meta) {
		return () => {};
	}

	const original = meta.getAttribute('content') ?? '';

	if (overlays) {
		// Remove resizes-content to let keyboard overlay
		const newContent = original.replace(INTERACTIVE_WIDGET_CONTENT, '').replace(/,\s*,/g, ',').replace(/,\s*$/, '').trim();
		meta.setAttribute('content', newContent);
	} else {
		// Add resizes-content to resize viewport
		if (!original.includes(INTERACTIVE_WIDGET_CONTENT)) {
			meta.setAttribute('content', `${original}, ${INTERACTIVE_WIDGET_CONTENT}`);
		}
	}

	return () => meta.setAttribute('content', original);
}