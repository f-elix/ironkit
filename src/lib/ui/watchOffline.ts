import { toast } from 'svelte-sonner';

export const watchOffline = () => {
	window.addEventListener('offline', () => {
		toast.dismiss();
		toast.info('Looks like you are offline.', {
			description: 'No problem, you can still use the app.',
			position: 'top-center',
			duration: 7000
		});
	});
	window.addEventListener('online', () => {
		toast.dismiss();
		toast.success('You are back online!', {
			// description: 'Changes are now synced to the cloud.',
			position: 'top-center',
			duration: 7000
		});
	});
};
