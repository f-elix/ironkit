import { onNavigate } from '$app/navigation';

export const setupViewTransition = () => {
	onNavigate((navigation) => {
		if (!document.startViewTransition) {
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
