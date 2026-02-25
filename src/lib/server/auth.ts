import * as env from '$env/static/private';
import { PUBLIC_JAZZ_API_KEY } from '$env/static/public';
import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { jazzPlugin } from 'jazz-tools/better-auth/auth/server';
import { JazzBetterAuthDatabaseAdapter } from 'jazz-tools/better-auth/database-adapter';

const requiredEnv = (name: string, value: string | undefined) => {
	if (!value) {
		throw new Error(`${name} environment variable is required`);
	}
	return value;
};

const createSyncServerUrl = () => {
	if (env.JAZZ_AUTH_SYNC_SERVER) {
		return env.JAZZ_AUTH_SYNC_SERVER;
	}

	const apiKey = requiredEnv('PUBLIC_JAZZ_API_KEY', PUBLIC_JAZZ_API_KEY);
	return `wss://cloud.jazz.tools/?key=${encodeURIComponent(apiKey)}`;
};

const createSocialProviders = () => {
	const clientId = env.GOOGLE_CLIENT_ID;
	const clientSecret = env.GOOGLE_CLIENT_SECRET;
	if (!clientId || !clientSecret) {
		return undefined;
	}

	return {
		google: {
			clientId,
			clientSecret
		}
	};
};

const createJazzBetterAuthOptions = () => {
	const baseURL = env.BETTER_AUTH_URL || env.SITE_URL;
	if (!baseURL) {
		throw new Error('BETTER_AUTH_URL or SITE_URL environment variable is required');
	}

	return {
		baseURL,
		secret: requiredEnv('BETTER_AUTH_SECRET', env.BETTER_AUTH_SECRET),
		database: JazzBetterAuthDatabaseAdapter({
			syncServer: createSyncServerUrl(),
			accountID: requiredEnv('JAZZ_AUTH_WORKER_ACCOUNT_ID', env.JAZZ_WORKER_ACCOUNT),
			accountSecret: requiredEnv(
				'JAZZ_AUTH_WORKER_ACCOUNT_SECRET',
				env.JAZZ_WORKER_SECRET
			)
		}),
		socialProviders: createSocialProviders(),
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false,
			minPasswordLength: 5
		},
		plugins: [jazzPlugin()]
	} satisfies BetterAuthOptions;
};

export const auth = betterAuth(createJazzBetterAuthOptions());
