import { onNavigate } from '$app/navigation';

export const setupViewTransition = () => {
	onNavigate((navigation) => {
		if (!document.startViewTransition) {
			return;
		}
		// Don't run view transition if the page is the same
		if (navigation.to?.url.pathname === navigation.from?.url.pathname) {
			return;
		}
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
};
