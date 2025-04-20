import type {
	Models,
	CollectionNameFromModels,
	SubscriptionOptions,
	TriplitClient,
	QueryBuilder,
	SchemaQuery
} from '@triplit/client';
import { useConnectionStatus, useQuery } from '@triplit/svelte';

/**
 * A composable that provides access to Triplit client functionality
 *
 * @param client - The Triplit client instance to use
 * @returns An object containing wrapped versions of useQuery and useConnectionStatus composables
 */

export const useTriplit = <M extends Models<M>, CollectionName extends CollectionNameFromModels<M>>(
	client: TriplitClient<M>
) => {
	function useQueryWrapped<Q extends SchemaQuery<M>>(
		collectionName: CollectionName,
		queryBuilder?: (q: QueryBuilder) => Parameters<typeof useQuery<M, Q>>[1],
		options?: Partial<SubscriptionOptions>
	) {
		return useQuery<M, Q>(
			client,
			queryBuilder ? queryBuilder(client.query(collectionName)) : client.query(collectionName),
			options
		);
	}

	function useConnectionStatusWrapped() {
		return useConnectionStatus(client);
	}

	return {
		useQuery: useQueryWrapped,
		useConnectionStatus: useConnectionStatusWrapped
	};
};
