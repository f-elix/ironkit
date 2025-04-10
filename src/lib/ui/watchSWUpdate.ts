import { toast } from 'svelte-sonner';

const showNotification = (newSW: ServiceWorker) => {
	toast.info('A new version of the app is available! Reload to update.', {
		position: 'top-center',
		duration: Infinity,
		action: {
			label: 'Reload',
			onClick: () => {
				newSW.postMessage({ type: 'SKIP_WAITING' });
				window.location.reload();
			}
		}
	});
};

export const watchSWUpdate = async () => {
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
