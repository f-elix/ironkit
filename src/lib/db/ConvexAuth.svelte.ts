import { convex } from '$lib/db/convex';
import { Context } from 'runed';
import { onMount } from 'svelte';

export class ConvexAuth {
	isAuthenticated = $state(false);
	isLoading = $state(true);
	userId = $state<string | null>(null);

	constructor() {
		onMount(() => {
			// Watch for auth state changes
			const unsubscribe = convex.onUpdate('auth', (auth: any) => {
				this.isAuthenticated = auth?.isAuthenticated ?? false;
				this.userId = auth?.userId ?? null;
				this.isLoading = false;
			});

			// Initial check
			convex
				.query('auth:currentUser' as any, {})
				.then((user: any) => {
					this.isAuthenticated = !!user;
					this.userId = user?._id ?? null;
					this.isLoading = false;
				})
				.catch(() => {
					this.isLoading = false;
				});

			return () => {
				if (unsubscribe) unsubscribe();
			};
		});
	}

	async signInWithGoogle() {
		// This will be triggered by the GoogleLogin component
		// which will handle the OAuth redirect
	}

	async signOut() {
		try {
			await convex.mutation('auth:signOut' as any, {});
			this.isAuthenticated = false;
			this.userId = null;
		} catch (error) {
			console.error('Error signing out:', error);
		}
	}
}

export const convexAuthContext = new Context<ConvexAuth>('convexAuth');

export const setConvexAuth = () => {
	return convexAuthContext.set(new ConvexAuth());
};

export const getConvexAuth = () => {
	return convexAuthContext.get();
};
