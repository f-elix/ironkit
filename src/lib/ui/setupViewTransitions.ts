import { onNavigate } from '$app/navigation';
import { resolve } from '$app/paths';
import { isDesktop } from '$lib/isDesktop.svelte';
import type { Navigation } from '@sveltejs/kit';

type TransitionType =
	| 'main-slide-in-from-right'
	| 'main-slide-in-from-left'
	| 'training-log-slide-in-from-right'
	| 'training-log-slide-in-from-left'
	| 'workout'
	| 'fade';

const getTransitionType = (navigation: Navigation): TransitionType => {
	if (isDesktop.current) {
		return 'fade';
	}

	const from = navigation.from?.url.pathname;
	const to = navigation.to?.url.pathname;

	if (!from || !to) {
		return 'fade';
	}

	if (from === resolve('/')) {
		return 'main-slide-in-from-right';
	}

	if (to === resolve('/')) {
		return 'main-slide-in-from-left';
	}

	if (
		from === resolve('/(app)/tools/training-log') &&
		to === resolve('/(app)/tools/training-log/exercises')
	) {
		return 'training-log-slide-in-from-right';
	}

	if (
		from === resolve('/(app)/tools/training-log/exercises') &&
		to === resolve('/(app)/tools/training-log')
	) {
		return 'training-log-slide-in-from-left';
	}

	if (to.startsWith(resolve('/(app)/tools/training-log/workout-[id]', { id: 'id' }))) {
		return 'workout';
	}

	if (from.startsWith(resolve('/(app)/tools/training-log/workout-[id]', { id: 'id' }))) {
		return 'workout';
	}

	return 'fade';
};

export const setupViewTransitions = () => {
	onNavigate((navigation) => {
		if (!document.startViewTransition) {
			return;
		}
		// Don't run view transition if the page is the same
		if (navigation.to?.url.pathname === navigation.from?.url.pathname) {
			return;
		}
		return new Promise((resolve) => {
			document.startViewTransition({
				update: async () => {
					resolve();
					await navigation.complete;
				},
				types: [getTransitionType(navigation)]
			});
		});
	});
};
