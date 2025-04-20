import { TriplitClient } from '@triplit/client';
import { schema } from '$triplit/schema';
import { useTriplit } from '$lib/db/useTriplit';
import { PUBLIC_TRIPLIT_SERVER_URL } from '$env/static/public';

export const triplit = new TriplitClient({
	schema,
	serverUrl: PUBLIC_TRIPLIT_SERVER_URL,
	storage: {
		type: 'indexeddb',
		name: 'ironkit'
	},
	autoConnect: false
});

export const { useQuery, useConnectionStatus } = useTriplit(triplit);
