import { convex } from './convex';
import type { FunctionReference, FunctionReturnType, FunctionArgs } from 'convex/server';
import { untrack } from 'svelte';

/**
 * Svelte 5 runes-compatible hook for Convex queries
 */
export function useConvexQuery<Query extends FunctionReference<'query'>>(
	query: Query,
	args: FunctionArgs<Query>
) {
	let data = $state<FunctionReturnType<Query> | undefined>(undefined);
	let error = $state<Error | undefined>(undefined);
	let isLoading = $state(true);

	$effect(() => {
		isLoading = true;
		error = undefined;

		const watchQuery = convex.watchQuery(query, args);
		const unsubscribe = watchQuery.onUpdate(() => {
			untrack(() => {
				if (watchQuery.localQueryResult) {
					if (watchQuery.localQueryResult.kind === 'Error') {
						error = new Error(watchQuery.localQueryResult.error);
						isLoading = false;
					} else {
						data = watchQuery.localQueryResult.value as FunctionReturnType<Query>;
						error = undefined;
						isLoading = false;
					}
				}
			});
		});

		return () => {
			unsubscribe();
		};
	});

	return {
		get data() {
			return data;
		},
		get error() {
			return error;
		},
		get isLoading() {
			return isLoading;
		}
	};
}

/**
 * Svelte 5 runes-compatible hook for Convex mutations
 */
export function useConvexMutation<Mutation extends FunctionReference<'mutation'>>(
	mutation: Mutation
) {
	let isLoading = $state(false);
	let error = $state<Error | undefined>(undefined);

	const mutate = async (args: FunctionArgs<Mutation>): Promise<FunctionReturnType<Mutation>> => {
		isLoading = true;
		error = undefined;

		try {
			const result = await convex.mutation(mutation, args);
			isLoading = false;
			return result as FunctionReturnType<Mutation>;
		} catch (err) {
			error = err as Error;
			isLoading = false;
			throw err;
		}
	};

	return {
		mutate,
		get isLoading() {
			return isLoading;
		},
		get error() {
			return error;
		}
	};
}

/**
 * Helper for calling Convex actions
 */
export async function useConvexAction<Action extends FunctionReference<'action'>>(
	action: Action,
	args: FunctionArgs<Action>
): Promise<FunctionReturnType<Action>> {
	return convex.action(action, args) as Promise<FunctionReturnType<Action>>;
}
