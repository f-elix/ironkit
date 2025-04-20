import { getRequestEvent } from '$app/server';
import { shouldNeverHappen } from '$lib/shouldNeverHappen';
import { json } from '@sveltejs/kit';
import { kv } from '$lib/server/kv';

const USER_ID = '1';

const getKey = (table: string) => `sync:user:${USER_ID}:${table}`;

const getTableName = () => {
	const event = getRequestEvent();
	const url = new URL(event.request.url);
	const table = url.searchParams.get('table');
	if (!table) {
		shouldNeverHappen('Table is required');
	}
	return table as string;
};

export const GET = async () => {
	console.log('GET');
	return json({});
	const table = getTableName();
	if (!table) {
		shouldNeverHappen('Table is required');
	}
	const key = getKey(table);
	const data = await kv.get(key);
	if (!data) {
	}
	return json(data);
};

export const POST = async ({ request }) => {
	const data = await request.json();
	console.log(data);
	return json(data);
	const table = getTableName();
	const key = getKey(table);
	data.updatedAt = Date.now();
	await kv.set(key, data);
};
