const domain = process.env.CONVEX_SITE_URL;
if (!domain) {
	throw new Error('CONVEX_SITE_URL environment variable is required');
}

export default {
	providers: [
		{
			domain,
			applicationID: 'convex'
		}
	]
};
