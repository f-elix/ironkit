import { toast } from 'svelte-sonner';

export const watchOffline = () => {
	window.addEventListener('offline', () => {
		toast.dismiss();
		toast.warning('Looks like you are offline.', {
			// description: 'Changes will be saved locally. Connect to the internet to sync to the cloud.',
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
