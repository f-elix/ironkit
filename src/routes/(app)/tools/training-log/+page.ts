import { tools } from '$lib/data/tools';

export const load = async () => {
	return {
		metaData: {
			title: tools.trainingLog.title
		}
	};
};
