import { useConvexClient, useQuery } from 'convex-svelte';
import type { FunctionArgs, FunctionReference, FunctionReturnType } from 'convex/server';

export const useQueryMutation = <
	Q extends FunctionReference<'query'>,
	M extends FunctionReference<'mutation'>
>({
	query,
	args = {},
	queryOptions,
	mutation,
	optimisticUpdate
}: {
	query: Q;
	args?: FunctionArgs<Q> | undefined;
	queryOptions?: Parameters<typeof useQuery>[2];
	mutation: M;
	optimisticUpdate?: (data: FunctionReturnType<Q>, mutationArgs: FunctionArgs<M>) => void;
}) => {
	const client = useConvexClient();
	return [
		useQuery(query, args, queryOptions),
		(mutationArgs: FunctionArgs<M>) =>
			client.mutation(mutation, mutationArgs, {
				optimisticUpdate: (localStore) => {
					const data = localStore.getQuery(query, args);
					if (!data) {
						return;
					}
					if (typeof optimisticUpdate === 'function') {
						optimisticUpdate(data, mutationArgs);
					} else {
						localStore.setQuery(query, args, {
							...data,
							...mutationArgs
						});
					}
				}
			})
	] as const;
};
