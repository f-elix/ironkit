export const roundWeightToNearest = (weight: number, nearest: number) => {
	return Math.round(weight / nearest) * nearest;
};
