import { createClient, type GenericCtx } from '@convex-dev/better-auth';
import { convex } from '@convex-dev/better-auth/plugins';
import { components } from './_generated/api';
import type { DataModel } from './_generated/dataModel';
import { betterAuth } from 'better-auth';

const siteUrl = process.env.SITE_URL;
if (!siteUrl) {
	throw new Error('SITE_URL environment variable is required');
}

// The component client has methods needed for integrating Convex with Better Auth,
// as well as helper methods for general use.
export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (
	ctx: GenericCtx<DataModel>,
	{ optionsOnly } = { optionsOnly: false }
) => {
	return betterAuth({
		// disable logging when createAuth is called just to generate options.
		// this is not required, but there's a lot of noise in logs without it.
		logger: {
			disabled: optionsOnly
		},
		baseURL: siteUrl,
		database: authComponent.adapter(ctx),
		socialProviders: {
			google: {
				clientId: (() => {
					const id = process.env.GOOGLE_CLIENT_ID;
					if (!id) {
						throw new Error('GOOGLE_CLIENT_ID environment variable is required');
					}
					return id;
				})(),
				clientSecret: (() => {
					const secret = process.env.GOOGLE_CLIENT_SECRET;
					if (!secret) {
						throw new Error('GOOGLE_CLIENT_SECRET environment variable is required');
					}
					return secret;
				})()
			}
		},
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false
		},
		plugins: [
			// The Convex plugin is required for Convex compatibility
			convex()
		]
	});
};

export const { getAuthUser } = authComponent;
