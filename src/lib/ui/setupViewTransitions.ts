import { onNavigate } from '$app/navigation';
import {
	PAGE__ROOT,
	PAGE_tools_training_log,
	PAGE_tools_training_log_exercises,
	PAGE_tools_training_log_workout_id
} from '$lib/ROUTES';
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

	if (from === PAGE__ROOT) {
		return 'main-slide-in-from-right';
	}

	if (to === PAGE__ROOT) {
		return 'main-slide-in-from-left';
	}

	if (from === PAGE_tools_training_log && to === PAGE_tools_training_log_exercises) {
		return 'training-log-slide-in-from-right';
	}

	if (from === PAGE_tools_training_log_exercises && to === PAGE_tools_training_log) {
		return 'training-log-slide-in-from-left';
	}

	if (to.startsWith(PAGE_tools_training_log_workout_id({ id: '' }))) {
		return 'workout';
	}

	if (from.startsWith(PAGE_tools_training_log_workout_id({ id: '' }))) {
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
