import { goto } from '$app/navigation';
import { page } from '$app/state';
import { triplit } from '$lib/db/triplit';
import { getAnonData } from '$lib/db/getAnonData';
import { resolve } from '$app/paths';
import type { AuthSession } from '@supabase/supabase-js';
import { Context } from 'runed';
import { onMount } from 'svelte';
import { supabase } from '$lib/db/supabase';
import type { CollectionName } from '$lib/db/types';

export class Auth {
	session = $state<Maybe<AuthSession>>();
	user = $derived(this.session?.user);

	constructor() {
		onMount(() => {
			const { data } = supabase.auth.onAuthStateChange((event, session) => {
				if (event === 'INITIAL_SESSION') {
					this.#handleInitialSessionEvent(session);
				}
				if (event === 'SIGNED_IN' && session) {
					this.#handleSignInEvent(session);
				}
				if (event === 'TOKEN_REFRESHED' && session) {
					this.#handleTokenRefreshEvent(session);
				}
				if (event === 'SIGNED_OUT') {
					this.#goToApp();
				}
				this.session = session;
			});

			return () => {
				data.subscription.unsubscribe();
			};
		});
	}

	async #handleInitialSessionEvent(session: Maybe<AuthSession>) {
		const accessToken = session?.access_token;
		if (accessToken) {
			await triplit.startSession(accessToken);
		}
		const pathname = page.url.pathname;
		if (pathname === resolve('/auth') && session) {
			return this.#goToApp();
		}
	}

	async #handleTokenRefreshEvent(session: AuthSession) {
		await triplit.endSession();
		await triplit.startSession(session.access_token);
	}

	async #syncAnonData(session: AuthSession) {
		const anonCollections = await getAnonData();
		await triplit.transact(async (tx) => {
			for await (const [collectionName, items] of Object.entries(anonCollections)) {
				for await (const item of items) {
					await tx.update(collectionName as CollectionName, item.id, {
						userId: session.user.id
					});
				}
			}
		});
	}

	async #handleSignInEvent(session: AuthSession) {
		// User is already signed in
		if (this.session) {
			return;
		}
		await this.#syncAnonData(session);
		await triplit.startSession(session.access_token);
		return this.#goToApp();
	}

	#goToApp() {
		return goto(resolve('/'));
	}

	async signOut() {
		await triplit.endSession();
		await triplit.clear();
		await supabase.auth.signOut();
	}
}

export const authContext = new Context<Auth>('auth');

export const setAuth = () => {
	return authContext.set(new Auth());
};
