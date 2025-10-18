import { getAuthUserId } from '@convex-dev/auth/server';

export const requireUser = async (ctx: Parameters<typeof getAuthUserId>[0]) => {
	const userId = await getAuthUserId(ctx);
	if (!userId) {
		throw new Error('Not authenticated');
	}
	return userId;
};
