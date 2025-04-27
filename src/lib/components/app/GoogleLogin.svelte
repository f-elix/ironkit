<script lang="ts">
	import { PAGE__ROOT } from '$lib/ROUTES';
	import { goto } from '$app/navigation';
	import { ElementSize } from 'runed';
	import { supabase } from '$lib/db/supabase';

	let loaded = $state(false);

	// generate nonce to use for google id token sign-in
	const generateNonce = async (): Promise<string[]> => {
		const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
		const encoder = new TextEncoder();
		const encodedNonce = encoder.encode(nonce);
		const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

		return [nonce, hashedNonce];
	};

	const onGoogleLoad = async () => {
		const [nonce, hashedNonce] = await generateNonce();
		window.google.accounts.id.initialize({
			client_id: '127333049098-0pkaocu3pqi30fn2h97c2gfs74arh30t.apps.googleusercontent.com',
			nonce: hashedNonce,
			// with chrome's removal of third-party cookiesm, we need to use FedCM instead (https://developers.google.com/identity/gsi/web/guides/fedcm-migration)
			use_fedcm_for_prompt: true,
			ux_mode: 'popup',
			callback: async (response) => {
				try {
					// send id token returned in response.credential to supabase
					const { error } = await supabase.auth.signInWithIdToken({
						provider: 'google',
						token: response.credential,
						nonce
					});

					if (error) {
						throw error;
					}

					// redirect to protected page
					goto(PAGE__ROOT);
				} catch (error) {
					console.error('Error logging in with Google One Tap', error);
				}
			}
		});
		loaded = true;
	};

	const renderButton = (node: HTMLElement, loaded: boolean) => {
		const update = (loaded: boolean) => {
			if (!loaded) {
				return;
			}
			const size = new ElementSize(() => node);
			$effect(() => {
				window.google.accounts.id.renderButton(node, {
					theme: 'outline',
					size: 'large',
					type: 'standard',
					width: Math.min(size.width, 400)
				});
			});
		};
		update(loaded);
		return {
			update
		};
	};
</script>

<svelte:head>
	<script src="https://accounts.google.com/gsi/client" async onload={onGoogleLoad}></script>
</svelte:head>

<div class="mx-auto w-full max-w-96" use:renderButton={loaded}></div>
