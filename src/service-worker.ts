/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

declare let self: ServiceWorkerGlobalScope;

import { build, files, prerendered, version } from '$service-worker';

const CACHE = `cache-${version}`;
const ASSETS = [...build, ...files, ...prerendered];

self.addEventListener('install', (event) => {
	const addFilesToCache = async () => {
		const cache = await caches.open(CACHE);
		await cache.addAll(ASSETS);
	};

	event.waitUntil(addFilesToCache());
});

self.addEventListener('activate', (event) => {
	const deleteOldCaches = async () => {
		const keys = await caches.keys();
		await Promise.all(keys.map((key) => key !== CACHE && caches.delete(key)));
	};

	event.waitUntil(deleteOldCaches());
});

// Fetch
self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') {
		return;
	}

	if (event.request.url.includes('/api/sync')) {
		return;
	}

	const respond = async () => {
		const url = new URL(event.request.url);
		const cache = await caches.open(CACHE);

		// `build`/`files` can always be served from the cache
		if (ASSETS.includes(url.pathname)) {
			const cachedResponse = await cache.match(url.pathname);
			if (cachedResponse) {
				return cachedResponse;
			}
		}

		// Try network first
		try {
			const response = await fetch(event.request);

			// if we're offline, fetch can return a value that is not a Response
			// instead of throwing - and we can't pass this non-Response to respondWith
			if (!(response instanceof Response)) {
				throw new Error('invalid response from fetch');
			}

			const isNotExtension = url.protocol === 'http:';
			const isSuccess = response.status === 200;
			if (isNotExtension && isSuccess) {
				cache.put(event.request, response.clone());
			}
			return response;
		} catch (err) {
			const response = await cache.match(event.request);

			if (response) {
				return response;
			}

			// if there's no cache, then just error out
			// as there is nothing we can do to respond to this request
			throw err;
		}
	};

	event.respondWith(respond());
});

self.addEventListener('message', (event) => {
	if (event.data?.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}
});
