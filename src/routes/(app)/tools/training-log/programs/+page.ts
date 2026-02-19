import { tools } from '$lib/data/tools';

export const load = async () => {
	return {
		metaData: {
			...tools.trainingLog,
			title: 'Programs'
		}
	};
};
