declare global {
	type Maybe<T> = T | null | undefined;

	/**
	 * VirtualKeyboard API types (Chromium 94+)
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/VirtualKeyboard_API
	 */
	interface VirtualKeyboard extends EventTarget {
		readonly boundingRect: DOMRect;
		overlaysContent: boolean;
		hide(): void;
		show(): void;
		ongeometrychange: ((this: VirtualKeyboard, ev: Event) => unknown) | null;
	}

	interface Navigator {
		readonly virtualKeyboard?: VirtualKeyboard;
	}
}

export {};
