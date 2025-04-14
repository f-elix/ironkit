import {
	computeSelector,
	internal,
	observable,
	// @ts-expect-error internal
	beginTracking,
	// @ts-expect-error internal
	endTracking,
	// @ts-expect-error internal
	setupTracking
} from '@legendapp/state';
import { type UseSelectorOptions } from '@legendapp/state/react';
import { type ListenerParams, isPrimitive, when } from '@legendapp/state';
import type {
	GetOptions,
	Observable,
	ObserveEvent,
	ObserveOptions,
	Selector
} from '@legendapp/state';
import { pauseContext } from './pauseContext.svelte';

interface SelectorFunctions<T> {
	subscribe: (onStoreChange: () => void) => () => void;
	getVersion: () => number;
	run: (selector: Selector<T>) => T;
}

function trackSelector<T>(
	selector: Selector<T>,
	update: (params: ListenerParams) => void,
	getOptions?: GetOptions,
	observeEvent?: ObserveEvent<T>,
	observeOptions?: ObserveOptions
) {
	let dispose: undefined | (() => void);

	beginTracking();
	const value = selector
		? // @ts-expect-error fromComputed is internal
			computeSelector(selector, getOptions, observeEvent, observeOptions?.fromComputed)
		: selector;
	const tracker = internal.tracking.current;
	const nodes = tracker!.nodes;
	endTracking();

	if (!observeEvent?.cancel) {
		dispose = setupTracking(nodes, update, false, observeOptions?.immediate);
	}

	return { value, dispose };
}

function createSelectorFunctions<T>(
	options: UseSelectorOptions | undefined,
	isPaused$: Observable<boolean>
): SelectorFunctions<T> {
	let version = 0;
	let notify: () => void;
	let dispose: (() => void) | undefined;
	let _selector: Selector<T>;
	let prev: T;
	let pendingUpdate: T | undefined = undefined;

	const _update = ({ value }: { value: ListenerParams['value'] }) => {
		if (isPaused$?.peek()) {
			const next = pendingUpdate;
			pendingUpdate = value as T;
			if (next === undefined) {
				when(
					() => !isPaused$.get(),
					() => {
						const latest = pendingUpdate;
						pendingUpdate = undefined;
						_update({ value: latest });
					}
				);
			}
		} else {
			// If skipCheck then don't need to re-run selector
			let changed = options?.skipCheck;
			if (!changed) {
				const newValue = run();

				// If newValue is different than previous value then it's changed.
				// Also if the selector returns an observable directly then its value will be the same as
				// the value from the listener, and that should always re-render.
				if (newValue !== prev || (!isPrimitive(newValue) && newValue === value)) {
					changed = true;
				}
			}
			if (changed) {
				version++;
				notify?.();
			}
		}
	};

	const run = () => {
		// Dispose if already listening
		dispose?.();

		const { value, dispose: _dispose } = trackSelector(
			_selector,
			_update,
			options,
			undefined,
			undefined
		);

		dispose = _dispose;

		return value;
	};

	return {
		subscribe: (onStoreChange: () => void) => {
			notify = onStoreChange;

			return () => {
				dispose?.();
				dispose = undefined;
			};
		},
		getVersion: () => version,
		run: (selector: Selector<T>) => {
			// Update the cached selector
			_selector = selector;

			return (prev = run());
		}
	};
}

export const use$ = <T>(selector: Selector<T>): { current: T } => {
	const isPaused$ = pauseContext.getOr(observable(false));
	const selectorFn = createSelectorFunctions<T>(undefined, isPaused$);

	// Initial value
	let value = $state<T>(selectorFn.run(selector));

	// Subscribe to changes
	$effect(() => {
		return selectorFn.subscribe(() => {
			value = selectorFn.run(selector);
		});
	});

	return {
		get current() {
			return value;
		}
	};
};
