import { betterAuthClient } from '$lib/auth-client';
import { IronkitAccount } from '$lib/jazz/schema';

export const setAuthUserProfile = async () => {
	const { profile } = await IronkitAccount.getMe().$jazz.ensureLoaded({
		resolve: {
			profile: true
		}
	});
	const session = await betterAuthClient.getSession();
	const userName = session.data?.user.name;
	if (userName && userName !== profile.name) {
		profile.$jazz.set('name', userName);
	}
};
