import { createClient, type GenericCtx } from '@convex-dev/better-auth';
import { convex } from '@convex-dev/better-auth/plugins';
import { jazzPlugin } from 'jazz-tools/better-auth/auth/server';
import { components } from './_generated/api';
import type { DataModel } from './_generated/dataModel';
import { betterAuth, type BetterAuthOptions } from 'better-auth';
import type {
	GenericDataModel,
	GenericQueryCtx,
	GenericMutationCtx,
	GenericActionCtx
} from 'convex/server';
import authConfig from './auth.config';

const siteUrl = process.env.SITE_URL;
if (!siteUrl) {
	throw new Error('SITE_URL environment variable is required');
}

// The component client has methods needed for integrating Convex with Better Auth,
// as well as helper methods for general use.
export const authComponent = createClient(components.betterAuth);

// Type helper to convert app-specific context to generic context
type AppCtx =
	| GenericQueryCtx<DataModel>
	| GenericMutationCtx<DataModel>
	| GenericActionCtx<DataModel>;

export const createAuthOptions = (ctx: AppCtx) => {
	return {
		baseURL: siteUrl,
		database: authComponent.adapter(ctx as GenericCtx<GenericDataModel>),
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
			convex({
				authConfig,
				jwksRotateOnTokenGenerationError: true
			}),
			// Persist Jazz account credentials server-side in Better Auth user records.
			jazzPlugin()
		]
	} satisfies BetterAuthOptions;
};

export const createAuth = (ctx: AppCtx) => {
	return betterAuth(createAuthOptions(ctx));
};

// Helper to get the authenticated user with proper typing for this app's DataModel
export const getAuthUser = (ctx: AppCtx) => {
	return authComponent.getAuthUser(ctx as GenericCtx<GenericDataModel>);
};
