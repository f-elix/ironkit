import { dev } from '$app/environment';
import { toast } from 'svelte-sonner';

const showNotification = (newSW: ServiceWorker) => {
	toast.info('A new version of the app is available! Reload to update.', {
		position: 'top-center',
		duration: Infinity,
		action: {
			label: 'Reload',
			onClick: () => {
				// Wait for the new service worker to take control before reloading
				navigator.serviceWorker.addEventListener('controllerchange', () => {
					window.location.reload();
				});
				newSW.postMessage({ type: 'SKIP_WAITING' });
			}
		}
	});
};

export const watchSWUpdate = async () => {
	if (dev) {
		return;
	}
	const registration = await navigator.serviceWorker.ready;
	registration.addEventListener('updatefound', () => {
		const newSW = registration.installing;
		if (!newSW) {
			return;
		}
		newSW.addEventListener('statechange', () => {
			if (newSW.state === 'installed') {
				showNotification(newSW);
			}
		});
	});
};
