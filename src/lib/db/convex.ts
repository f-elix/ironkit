import { ConvexClient } from 'convex/browser';
import { browser } from '$app/environment';

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL || '';

if (!CONVEX_URL && browser) {
	console.warn('VITE_CONVEX_URL is not set');
}

export const convex = new ConvexClient(CONVEX_URL);
