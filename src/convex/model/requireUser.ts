import { authComponent } from '../auth';
import { GenericCtx } from '../_generated/server';

export const requireUser = async (ctx: GenericCtx) => {
	const user = await authComponent.getAuthUser(ctx);
	if (!user) {
		throw new Error('Not authenticated');
	}
	return user;
};
