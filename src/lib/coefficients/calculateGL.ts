import type { GenderClass } from '$lib/types';

type CompetitionType = 'CLBN' | 'EQPL' | 'EQBN' | 'CLPL';

export const calculateGL = (
	bodyweight: number,
	total: number,
	gender: GenderClass,
	competition: CompetitionType = 'CLPL'
) => {
	const maleCoeffCLPL = [1199.72839, 1025.18162, 0.00921];
	const maleCoeffCLBN = [320.98041, 281.40258, 0.01008];
	const maleCoeffEQPL = [1236.25115, 1449.21864, 0.01644];
	const maleCoeffEQBN = [381.22073, 733.79378, 0.02398];

	const femaleCoeffCLPL = [610.32796, 1045.59282, 0.03048];
	const femaleCoeffCLBN = [142.40398, 442.52671, 0.04724];
	const femaleCoeffEQPL = [758.63878, 949.31382, 0.02435];
	const femaleCoeffEQBN = [221.82209, 357.00377, 0.02937];

	const isFemale = gender === 'female';

	let coeff: number[];
	if (isFemale) {
		switch (competition) {
			case 'CLBN':
				coeff = femaleCoeffCLBN;
				break;
			case 'EQPL':
				coeff = femaleCoeffEQPL;
				break;
			case 'EQBN':
				coeff = femaleCoeffEQBN;
				break;
			case 'CLPL':
			default:
				coeff = femaleCoeffCLPL;
				break;
		}
	} else {
		switch (competition) {
			case 'CLBN':
				coeff = maleCoeffCLBN;
				break;
			case 'EQPL':
				coeff = maleCoeffEQPL;
				break;
			case 'EQBN':
				coeff = maleCoeffEQBN;
				break;
			case 'CLPL':
			default:
				coeff = maleCoeffCLPL;
				break;
		}
	}
	if (bodyweight < 35) {
		return 0.0;
	}

	const power = -coeff[2] * bodyweight;
	const score = total * (100 / (coeff[0] - coeff[1] * Math.pow(Math.E, power)));
	return score < 0 ? 0.0 : +score.toFixed(2);
};
