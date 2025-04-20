import { TriplitClient } from '@triplit/client';
import { schema } from '$triplit/schema';
import { useTriplit } from '$lib/db/useTriplit';
import { PUBLIC_TRIPLIT_SERVER_URL } from '$env/static/public';
import { browser } from '$app/environment';

export const triplit = new TriplitClient({
	schema,
	serverUrl: PUBLIC_TRIPLIT_SERVER_URL,
	storage: {
		type: browser ? 'indexeddb' : 'memory',
		name: 'ironkit'
	},
	autoConnect: false
});

export const { useQuery, useConnectionStatus } = useTriplit(triplit);
