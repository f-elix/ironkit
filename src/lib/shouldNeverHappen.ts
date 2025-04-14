export const shouldNeverHappen = (message: string, ...args: unknown[]) => {
	console.error(message, ...args);
	throw new Error(`This should never happen: ${message}`);
};
