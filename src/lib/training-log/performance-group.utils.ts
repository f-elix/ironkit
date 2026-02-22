/**
 * Returns the display label for a performance group (superset, circuit, etc.).
 * Uses custom label if provided, otherwise derives from exercise count.
 */
export function getPerformanceGroupLabel(
	exerciseCount: number,
	customLabel?: string | null
): string | null {
	if (customLabel) {
		return customLabel;
	}
	if (exerciseCount === 2) {
		return 'Superset';
	}
	if (exerciseCount === 3) {
		return 'Triset';
	}
	if (exerciseCount >= 4) {
		return 'Circuit';
	}
	return null;
}
