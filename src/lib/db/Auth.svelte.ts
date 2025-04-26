import { goto } from '$app/navigation';
import { page } from '$app/state';
import { triplit } from '$lib/db/triplit';
import { getAnonData } from '$lib/db/getAnonData';
import { PAGE__ROOT } from '$lib/ROUTES';
import type { AuthSession } from '@supabase/supabase-js';
import { Context } from 'runed';
import { onMount } from 'svelte';
import { supabase } from '$lib/db/supabase';
import type { CollectionName } from '$lib/db/types';

// @TODO Create a route for this
const PAGE_auth = '/auth';

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
					triplit.updateSessionToken(session.access_token);
				}
				this.session = session;
			});

			return () => {
				triplit.endSession();
				data.subscription.unsubscribe();
			};
		});
	}

	async #handleInitialSessionEvent(session: Maybe<AuthSession>) {
		const accessToken = session?.access_token;
		if (accessToken) {
			await triplit.startSession(accessToken);
			triplit.updateSessionToken(accessToken);
		}
		const pathname = page.url.pathname;
		if (pathname === PAGE_auth && session) {
			return this.#goToApp();
		}
	}

	async #syncAnonData(session: AuthSession) {
		const anonCollections = await getAnonData();
		await triplit.transact(async (tx) => {
			await Promise.all(
				Object.entries(anonCollections).map(async ([collectionName, collection]) => {
					return Promise.all(
						collection.map((item) => {
							item.userId = session.user.id;
							tx.insert(collectionName as CollectionName, item);
						})
					);
				})
			);
		});
	}

	async #handleSignInEvent(session: AuthSession) {
		// User is already signed in
		if (this.session) {
			return;
		}
		await triplit.startSession(session.access_token);
		await this.#syncAnonData(session);
		return this.#goToApp();
	}

	#goToApp() {
		return goto(PAGE__ROOT);
	}

	async signOut() {
		await triplit.endSession();
		await triplit.clear({ full: true });
		await supabase.auth.signOut();
	}
}

export const authContext = new Context<Auth>('auth');

export const setAuth = () => {
	return authContext.set(new Auth());
};
